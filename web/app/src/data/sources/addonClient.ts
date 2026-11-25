import { best, queries, type MatchCandidate, type MatchTarget } from '@/data/match/trackMatcher';
import { getBridge } from '@/extension/bridge';
import { trackLog } from '@/playback/trackLog';

export type AudioQualityTier = 'LOSSLESS' | 'HIGH' | 'LOW';

export interface AddonSettingOption {
  value: string;
  label?: string;
}

export interface AddonSetting {
  key: string;
  default?: string;
  options?: AddonSettingOption[];
}

export interface AddonManifest {
  id: string;
  name: string;
  version: string;
  resources: string[];
  settings: AddonSetting[];
  allowDownloads?: boolean;
  checkValidLossless?: boolean;
}

export interface AddonTrack extends MatchCandidate {
  id: string;
  artworkURL?: string | null;
  albumArtworkURL?: string | null;
  format?: string | null;
  audioQuality?: string | null;
  audioMode?: string | null;
  audioModes?: string[] | null;
  atmos?: boolean;
  streamURL?: string | null;
}

export interface AddonStreamResponse {
  url?: string | null;
  manifest?: string | null;
  format?: string | null;
  codec?: string | null;
  sampleRate?: number | null;
  bitDepth?: number | null;
  bitrate?: number | null;
  encrypted?: boolean;
  error?: string | null;
}

export interface AddonSourceConfig {
  id: string;
  url: string;
  name: string;
  version: string;
  enabled: boolean;
  manifest: AddonManifest | null;
  lastError: string | null;
}

export interface ResolvedAddonStream {
  addonId: string;
  addonName: string;
  kind: 'url' | 'manifest';
  value: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSec: number;
  codec: string | null;
  formatLabel: string;
  bitrateKbps: number | null;
  sampleRateHz: number | null;
  bitDepth: number | null;
}

const SEARCH_TTL_MS = 5 * 60_000;
const STREAM_TTL_MS = 2 * 60_000;
const TIMEOUT_MS = 10_000;
const UNSUPPORTED_WEB_CODECS = /\b(dsd|dsf|dff|dst|ac-?4|e-?ac-?3|eac3|ec-3|dolby\s*atmos|truehd|dts)\b/i;

const searchCache = new Map<string, { at: number; tracks: AddonTrack[] }>();
const streamCache = new Map<string, { at: number; stream: AddonStreamResponse }>();

export function normalizeAddonBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<{ status: number; body: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json, text/plain, */*' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      referrerPolicy: 'no-referrer',
    });
    return { status: res.status, body: await res.text() };
  } catch (error) {
    // CORS failure falls back to extension bridge if available and capable.
    if (error instanceof TypeError) {
      const bridge = getBridge();
      if (bridge) {
        try {
          const res = await bridge.call('addon.fetch', { url }, { timeoutMs: TIMEOUT_MS });
          const text =
            res.bodyEncoding === 'base64'
              ? new TextDecoder().decode(Uint8Array.from(atob(res.body), (c) => c.charCodeAt(0)))
              : res.body;
          return { status: res.status, body: text };
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<{ status: number; data: T | null }> {
  const res = await fetchText(url);
  if (!res) return { status: 0, data: null };
  try {
    return { status: res.status, data: JSON.parse(res.body) as T };
  } catch {
    return { status: res.status, data: null };
  }
}

const TIER_RANK: Record<AudioQualityTier, number> = { LOW: 0, HIGH: 1, LOSSLESS: 2 };

/** Picks the closest option value in a `quality` addon setting for the requested tier. */
export function matchTier(options: AddonSettingOption[], tier: AudioQualityTier): string | undefined {
  if (!options.length) return undefined;
  const classify = (opt: AddonSettingOption): AudioQualityTier => {
    const text = `${opt.value} ${opt.label ?? ''}`.toLowerCase();
    if (/lossless|flac|alac|hi.?res|max|master/.test(text)) return 'LOSSLESS';
    if (/low|96|128|saver|aac/.test(text)) return 'LOW';
    return 'HIGH';
  };
  const wanted = TIER_RANK[tier];
  return [...options].sort((a, b) => Math.abs(TIER_RANK[classify(a)] - wanted) - Math.abs(TIER_RANK[classify(b)] - wanted))[0]?.value;
}

export function buildAddonQueryParams(manifest: AddonManifest | null, tier: AudioQualityTier): URLSearchParams {
  const params = new URLSearchParams();
  for (const setting of manifest?.settings ?? []) {
    if (!setting.key) continue;
    if (setting.key.toLowerCase() === 'quality' && setting.options?.length) {
      const matched = matchTier(setting.options, tier);
      if (matched) {
        params.set(setting.key, matched);
        continue;
      }
    }
    if (setting.default !== undefined && setting.default !== '') {
      params.set(setting.key, setting.default);
    }
  }
  return params;
}

/** Probes `{base}/manifest.json` (falling back to `/search?q=test` when manifest is omitted). */
export async function probeAddon(rawUrl: string): Promise<{ url: string; manifest: AddonManifest; name: string; version: string }> {
  const base = normalizeAddonBaseUrl(rawUrl);
  if (!base) throw new Error('Enter a valid http:// or https:// audio source URL.');

  const manifestRes = await fetchJson<Partial<AddonManifest>>(`${base}/manifest.json`);
  if (manifestRes.status >= 200 && manifestRes.status < 300 && manifestRes.data) {
    const m = manifestRes.data;
    const resources = Array.isArray(m.resources) ? m.resources : [];
    if (resources.length > 0 && !resources.includes('search')) {
      throw new Error('This addon manifest does not declare a playable "search" resource.');
    }
    const name = (m.name || new URL(base).hostname).trim();
    const version = (m.version || '1.0.0').trim();
    const manifest: AddonManifest = {
      id: (m.id || base).trim(),
      name,
      version,
      resources,
      settings: Array.isArray(m.settings) ? m.settings : [],
      allowDownloads: m.allowDownloads,
      checkValidLossless: m.checkValidLossless,
    };
    return { url: base, manifest, name, version };
  }

  // Manifest is optional: identify the addon by probing `/search`.
  const searchProbe = await fetchJson<{ tracks?: unknown[] }>(`${base}/search?q=test`);
  if (searchProbe.status >= 200 && searchProbe.status < 300 && Array.isArray(searchProbe.data?.tracks)) {
    const hostname = new URL(base).hostname;
    const manifest: AddonManifest = {
      id: base,
      name: hostname,
      version: 'custom',
      resources: ['search'],
      settings: [],
    };
    return { url: base, manifest, name: hostname, version: 'custom' };
  }

  throw new Error(
    manifestRes.status === 0
      ? 'Could not reach source (network error or blocked by CORS).'
      : `Source returned HTTP ${manifestRes.status} for manifest.json.`,
  );
}

function normalizeAddonTrack(raw: Record<string, unknown>): AddonTrack | null {
  const id = String(raw.id ?? '').trim();
  const title = String(raw.title ?? '').trim();
  if (!id || !title) return null;
  const durationRaw = typeof raw.duration === 'number' ? raw.duration : Number(raw.duration);
  return {
    id,
    title,
    artist: String(raw.artist ?? '').trim(),
    album: typeof raw.album === 'string' ? raw.album : null,
    durationSec: Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null,
    artworkURL: typeof raw.artworkURL === 'string' ? raw.artworkURL : null,
    albumArtworkURL: typeof raw.albumArtworkURL === 'string' ? raw.albumArtworkURL : null,
    format: typeof raw.format === 'string' ? raw.format : null,
    audioQuality: typeof raw.audioQuality === 'string' ? raw.audioQuality : null,
    audioMode: typeof raw.audioMode === 'string' ? raw.audioMode : null,
    audioModes: Array.isArray(raw.audioModes) ? raw.audioModes.map(String) : null,
    atmos: raw.atmos === true,
    streamURL: typeof raw.streamURL === 'string' ? raw.streamURL : null,
  };
}

export async function searchAddon(addon: AddonSourceConfig, query: string, tier: AudioQualityTier): Promise<AddonTrack[]> {
  const key = `${addon.url}|${tier}|${query}`;
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < SEARCH_TTL_MS) return cached.tracks;

  const params = buildAddonQueryParams(addon.manifest, tier);
  params.set('q', query);
  const { status, data } = await fetchJson<{ tracks?: Record<string, unknown>[] }>(`${addon.url}/search?${params.toString()}`);
  if (status < 200 || status >= 300 || !Array.isArray(data?.tracks)) return [];

  const tracks = data.tracks.map(normalizeAddonTrack).filter((t): t is AddonTrack => t !== null);
  searchCache.set(key, { at: Date.now(), tracks });
  return tracks;
}

function isUnsupportedOnWeb(label: string | null | undefined, atmos?: boolean): boolean {
  if (atmos) return true;
  return !!label && UNSUPPORTED_WEB_CODECS.test(label);
}

/** Searches [addon] for [target], picks the best TrackMatcher hit, and resolves a playable web stream. */
export async function resolveAddonStream(
  addon: AddonSourceConfig,
  target: MatchTarget,
  tier: AudioQualityTier,
  losslessOutput: boolean,
): Promise<ResolvedAddonStream | null> {
  if (addon.manifest?.checkValidLossless && !losslessOutput && tier === 'LOSSLESS') {
    trackLog.d(`skipping ${addon.name}: lossless output disabled`, null);
    return null;
  }

  const searchQueries = queries(target);
  if (!searchQueries.length) return null;

  let matched: AddonTrack | null = null;
  for (const q of searchQueries.slice(0, 2)) {
    const candidates = (await searchAddon(addon, q, tier)).filter(
      (c) => !isUnsupportedOnWeb(`${c.format ?? ''} ${c.audioQuality ?? ''} ${c.audioMode ?? ''} ${(c.audioModes ?? []).join(' ')}`, c.atmos),
    );
    matched = best(candidates, target);
    if (matched) break;
  }
  if (!matched) {
    trackLog.d(`${addon.name}: no matching track`, null);
    return null;
  }

  const streamKey = `${addon.url}|${tier}|${matched.id}`;
  let stream: AddonStreamResponse | null = null;
  const cached = streamCache.get(streamKey);
  if (cached && Date.now() - cached.at < STREAM_TTL_MS) {
    stream = cached.stream;
  } else if (matched.streamURL) {
    stream = { url: matched.streamURL, format: matched.format };
  } else {
    const params = buildAddonQueryParams(addon.manifest, tier);
    const qs = params.toString();
    const endpoint = `${addon.url}/stream/${encodeURIComponent(matched.id)}${qs ? `?${qs}` : ''}`;
    const res = await fetchJson<AddonStreamResponse>(endpoint);
    if (res.status >= 200 && res.status < 300 && res.data) {
      stream = res.data;
      streamCache.set(streamKey, { at: Date.now(), stream });
    }
  }

  if (!stream || stream.error || stream.encrypted) {
    trackLog.w(`${addon.name} refused stream: ${stream?.error ?? (stream?.encrypted ? 'encrypted' : 'no response')}`, null);
    return null;
  }

  const codec = stream.codec ?? stream.format ?? matched.format ?? null;
  if (isUnsupportedOnWeb(codec)) {
    trackLog.w(`${addon.name} returned unsupported web codec (${codec})`, null);
    return null;
  }

  const bitrateKbps = stream.bitrate ? (stream.bitrate > 10_000 ? Math.round(stream.bitrate / 1000) : Math.round(stream.bitrate)) : null;
  const parts = [codec, stream.bitDepth ? `${stream.bitDepth}-bit` : null, stream.sampleRate ? `${Math.round(stream.sampleRate / 1000)}kHz` : null, bitrateKbps ? `${bitrateKbps}kbps` : null].filter(Boolean);
  const formatLabel = parts.join(' ') || 'Addon stream';

  if (stream.manifest) {
    return {
      addonId: addon.id,
      addonName: addon.name,
      kind: 'manifest',
      value: stream.manifest,
      title: matched.title,
      artist: matched.artist,
      artworkUrl: matched.artworkURL ?? matched.albumArtworkURL ?? null,
      durationSec: matched.durationSec ?? 0,
      codec,
      formatLabel: `${formatLabel} DASH`,
      bitrateKbps,
      sampleRateHz: stream.sampleRate ?? null,
      bitDepth: stream.bitDepth ?? null,
    };
  }

  if (stream.url) {
    return {
      addonId: addon.id,
      addonName: addon.name,
      kind: 'url',
      value: stream.url,
      title: matched.title,
      artist: matched.artist,
      artworkUrl: matched.artworkURL ?? matched.albumArtworkURL ?? null,
      durationSec: matched.durationSec ?? 0,
      codec,
      formatLabel,
      bitrateKbps,
      sampleRateHz: stream.sampleRate ?? null,
      bitDepth: stream.bitDepth ?? null,
    };
  }

  return null;
}
