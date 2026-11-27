import { best, type MatchCandidate, type MatchTarget } from '@/data/match/trackMatcher';
import type { Track } from '@/data/music/types';
import { siteRateLimiter } from '@/lib/rateLimiter';
import type { ResolvedAddonStream } from './addonClient';

const AUDIUS_BASE = 'https://discoveryprovider.audius.co/v1';
const ITUNES_BASE = 'https://itunes.apple.com';
const TIMEOUT_MS = 4000;

interface AudiusRawTrack {
  id?: string;
  title?: string;
  duration?: number;
  genre?: string;
  user?: { name?: string; handle?: string };
  artwork?: { '150x150'?: string; '480x480'?: string; '1000x1000'?: string };
}

interface ItunesRawTrack {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  trackTimeMillis?: number;
  artworkUrl100?: string;
  previewUrl?: string;
}

export function isExternalTrackId(videoId: string): boolean {
  return videoId.startsWith('audius:') || videoId.startsWith('itunes:');
}

export function buildAudiusStreamUrl(trackId: string): string {
  return `${AUDIUS_BASE}/tracks/${encodeURIComponent(trackId)}/stream?app_name=ISO-pod`;
}

/** Search full-length streamable tracks from Audius Discovery Network. */
export async function searchAudiusTracks(query: string, limit = 15): Promise<Track[]> {
  if (!query.trim() || typeof fetch !== 'function') return [];
  try {
    const url = `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(query)}&app_name=ISO-pod`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: AudiusRawTrack[] };
    const rows = Array.isArray(json.data) ? json.data : [];

    return rows
      .filter((r) => Boolean(r.id && r.title))
      .slice(0, limit)
      .map((r): Track => ({
        videoId: `audius:${r.id}`,
        title: r.title!,
        artists: [{ name: r.user?.name || r.user?.handle || 'Unknown Artist', id: null }],
        album: r.genre ? { name: r.genre, id: null } : null,
        durationSec: typeof r.duration === 'number' && r.duration > 0 ? Math.round(r.duration) : null,
        explicit: false,
        thumbnail: r.artwork?.['480x480'] ?? r.artwork?.['150x150'] ?? null,
        index: null,
        plays: null,
      }));
  } catch {
    return [];
  }
}

/** Search track metadata from iTunes Search API as an alternative catalog source. */
export async function searchItunesTracks(query: string, limit = 15): Promise<Track[]> {
  if (!query.trim() || typeof fetch !== 'function') return [];
  try {
    const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: ItunesRawTrack[] };
    const rows = Array.isArray(json.results) ? json.results : [];

    return rows
      .filter((r) => Boolean(r.trackId && r.trackName))
      .map((r): Track => ({
        videoId: `itunes:${r.trackId}`,
        title: r.trackName!,
        artists: [{ name: r.artistName || 'Unknown Artist', id: null }],
        album: r.collectionName ? { name: r.collectionName, id: null } : null,
        durationSec: typeof r.trackTimeMillis === 'number' ? Math.round(r.trackTimeMillis / 1000) : null,
        explicit: false,
        thumbnail: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        index: null,
        plays: null,
      }));
  } catch {
    return [];
  }
}

/**
 * Search alternative music sources (Audius full streams + iTunes catalog)
 * when YouTube search is unavailable or needs broader coverage.
 */
export async function searchExternalTracks(query: string, limit = 15): Promise<Track[]> {
  try {
    await siteRateLimiter.acquire('external');
  } catch {
    return [];
  }
  const [audiusRes, itunesRes] = await Promise.allSettled([
    searchAudiusTracks(query, limit),
    searchItunesTracks(query, Math.min(10, limit)),
  ]);

  const combined: Track[] = [];
  const seen = new Set<string>();

  const pushUnique = (tracks: Track[]) => {
    for (const t of tracks) {
      const key = `${t.title.toLowerCase().trim()}__${(t.artists[0]?.name ?? '').toLowerCase().trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(t);
    }
  };

  if (audiusRes.status === 'fulfilled') pushUnique(audiusRes.value);
  if (itunesRes.status === 'fulfilled') pushUnique(itunesRes.value);

  return combined.slice(0, limit);
}

/**
 * Resolve a playable audio stream from built-in non-YouTube sources (Audius full MP3,
 * or strict match on Audius for a track hint).
 */
export async function resolveExternalAudioStream(
  videoId: string,
  hint?: { title?: string; artist?: string; album?: string | null; durationSec?: number | null },
): Promise<ResolvedAddonStream | null> {
  if (typeof fetch !== 'function') return null;

  // 1. Direct Audius track ID
  if (videoId.startsWith('audius:')) {
    const trackId = videoId.slice('audius:'.length);
    if (!trackId) return null;
    let title = hint?.title ?? 'Audius Track';
    let artist = hint?.artist ?? '';
    let artworkUrl: string | null = null;
    let durationSec = hint?.durationSec ?? 0;

    try {
      const res = await fetch(`${AUDIUS_BASE}/tracks/${encodeURIComponent(trackId)}?app_name=ISO-pod`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: AudiusRawTrack };
        if (json.data) {
          title = json.data.title ?? title;
          artist = json.data.user?.name ?? artist;
          artworkUrl = json.data.artwork?.['480x480'] ?? json.data.artwork?.['150x150'] ?? null;
          durationSec = json.data.duration ?? durationSec;
        }
      }
    } catch {
      // Stream URL still works directly using hint metadata
    }

    return {
      addonId: 'audius',
      addonName: 'Audius',
      kind: 'url',
      value: buildAudiusStreamUrl(trackId),
      title,
      artist,
      artworkUrl,
      durationSec,
      codec: 'MP3',
      formatLabel: 'MP3 320kbps • Audius',
      bitrateKbps: 320,
      sampleRateHz: 44100,
      bitDepth: null,
    };
  }

  // 2. Match track hint strictly on Audius Discovery Network
  if (hint?.title) {
    const query = `${hint.title} ${hint.artist ?? ''}`.trim();
    const audiusTracks = await searchAudiusTracks(query, 8);
    if (audiusTracks.length > 0) {
      const target: MatchTarget = {
        title: hint.title,
        artist: hint.artist ?? '',
        durationSec: hint.durationSec ?? null,
        album: hint.album ?? null,
      };
      const candidates: Array<MatchCandidate & { track: Track }> = audiusTracks.map((t) => ({
        track: t,
        title: t.title,
        artist: t.artists.map((a) => a.name).join(', '),
        durationSec: t.durationSec,
        album: t.album?.name ?? null,
      }));
      const matched = best(candidates, target);
      if (matched) {
        const trackId = matched.track.videoId.slice('audius:'.length);
        return {
          addonId: 'audius',
          addonName: 'Audius',
          kind: 'url',
          value: buildAudiusStreamUrl(trackId),
          title: matched.track.title,
          artist: matched.artist,
          artworkUrl: matched.track.thumbnail,
          durationSec: matched.track.durationSec ?? 0,
          codec: 'MP3',
          formatLabel: 'MP3 320kbps • Audius',
          bitrateKbps: 320,
          sampleRateHz: 44100,
          bitDepth: null,
        };
      }
    }
  }

  // 3. Direct iTunes lookup fallback (preview stream if no full match was found)
  if (videoId.startsWith('itunes:')) {
    const itunesId = videoId.slice('itunes:'.length);
    try {
      const res = await fetch(`${ITUNES_BASE}/lookup?id=${encodeURIComponent(itunesId)}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        const json = (await res.json()) as { results?: ItunesRawTrack[] };
        const item = json.results?.[0];
        if (item?.previewUrl) {
          return {
            addonId: 'itunes',
            addonName: 'Apple iTunes',
            kind: 'url',
            value: item.previewUrl,
            title: item.trackName ?? hint?.title ?? 'Track',
            artist: item.artistName ?? hint?.artist ?? '',
            artworkUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null,
            durationSec: 30,
            codec: 'AAC',
            formatLabel: 'AAC 256kbps • iTunes',
            bitrateKbps: 256,
            sampleRateHz: 44100,
            bitDepth: null,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}
