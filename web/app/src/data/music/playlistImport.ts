import { cleanTrackTitle } from '@/data/apple/albumArt';
import {
  isTranslationMatch,
  normalize,
  parseTitle,
  queries as buildMatcherQueries,
  ranked,
  romajiOf,
  score,
  sharesArtist,
  withinSeconds,
  type MatchCandidate,
  type MatchTarget,
} from '@/data/match/trackMatcher';
import { searchAddon } from '@/data/sources/addonClient';
import { useAddons } from '@/data/sources/addonsStore';
import { candidateOf, fetchSpotifyPlaylistInfo, fetchSpotifyTracks } from '@/data/spotify/api';
import { getBridge } from '@/extension/bridge';
import { getProxyUrl, proxiedUrl } from '@/lib/iosProxy';
import { fetchPlaylist, fetchSearch, searchMainVideos, searchSongs } from './api';
import type { MusicItem, Track } from './types';

export type PlaylistSourceRef =
  | { provider: 'youtube'; id: string }
  | { provider: 'spotify'; id: string }
  | { provider: 'deezer'; id: string };

export interface ImportProgress {
  stage: 'fetching' | 'matching';
  title?: string;
  processed: number;
  total: number;
  matched: number;
}

export interface ImportedPlaylistResult {
  provider: 'youtube' | 'spotify' | 'deezer';
  title: string;
  tracks: Track[];
  totalSourceTracks: number;
  skippedCount: number;
}

export interface SourceTrackEntry {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  durationMs: number;
  coverUrl: string | null;
}

const KNOWN_FETCH_PLAYLIST_HASH = '21ea11a6ac75a5f3e01fd365d29c18e0a4a8b7dc09f89bbb5d73910190c6acaf';
const SPOTIFY_PATHFINDER = 'https://api-partner.spotify.com/pathfinder/v2/query';
const DESKTOP_UA_HINT_PATH = 'https://open.spotify.com/';

/**
 * Unwanted upload variants that indicate a modified or non-original cut when
 * they do not appear in the source track title.
 */
const JUNK_UPLOAD_PATTERN =
  /\b(8d|16d|bass\s*boost(?:ed)?|earrape|nightcore|sped\s*up|slowed|reverb|lofi|lo-fi|mashup|tik\s*tok|tiktok|ringtone|reaction|tutorial|teaser|trailer|shorts|fan\s*made|ai\s*cover|ai\s*version|1\s*hour|hours|loop|parody|lyric\s*prank|censored|clean\s*version)\b/i;

/**
 * Parses a YouTube / YouTube Music playlist URL or ID, a Spotify playlist URL / URI / ID,
 * or a Deezer public playlist URL.
 */
export function parsePlaylistInput(raw: string): PlaylistSourceRef | null {
  const input = raw.trim();
  if (!input) return null;

  const spotifyUri = input.match(/^spotify:playlist:([A-Za-z0-9]{10,})$/i);
  if (spotifyUri) return { provider: 'spotify', id: spotifyUri[1]! };

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (host.includes('spotify.com')) {
      const match = url.pathname.match(/\/playlist\/([A-Za-z0-9]{10,})/);
      if (match) return { provider: 'spotify', id: match[1]! };
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const list = url.searchParams.get('list');
      if (list) return { provider: 'youtube', id: list };
    }
    if (host.includes('deezer.com')) {
      const match = url.pathname.match(/\/playlist\/(\d+)/);
      if (match) return { provider: 'deezer', id: match[1]! };
    }
  } catch {
    // Fall through to raw ID detection.
  }

  if (/^(PL|VL|OLAK5uy_|RDCLAK|UU|LL|FL)[A-Za-z0-9_-]{8,}$/.test(input)) {
    return { provider: 'youtube', id: input };
  }
  if (/^[A-Za-z0-9]{22}$/.test(input)) {
    return { provider: 'spotify', id: input };
  }
  return null;
}

function fetchViaProxyWhenAvailable(url: string, init?: RequestInit): Promise<Response> {
  const target = getProxyUrl() ? proxiedUrl(url) : url;
  return fetch(target, init);
}

/**
 * Extracts initial tracks, playlist metadata, and the anonymous session token
 * embedded inside `https://open.spotify.com/embed/playlist/<id>`.
 */
export function parseSpotifyEmbedHtml(html: string): {
  title: string;
  coverUrl: string | null;
  tracks: SourceTrackEntry[];
  accessToken: string | null;
} | null {
  const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch?.[1]) return null;
  try {
    const parsed = JSON.parse(nextDataMatch[1]) as {
      props?: {
        pageProps?: {
          state?: {
            settings?: { session?: { accessToken?: string } };
            data?: {
              entity?: {
                name?: string;
                title?: string;
                coverArt?: { sources?: { url?: string }[] };
                trackList?: { title?: string; subtitle?: string; duration?: number; uri?: string; uid?: string }[];
              };
            };
          };
        };
      };
    };
    const state = parsed.props?.pageProps?.state;
    const entity = state?.data?.entity;
    const rawList = entity?.trackList;
    if (!entity || !Array.isArray(rawList)) return null;
    const title = (entity.name || entity.title || 'Spotify Playlist').trim();
    const coverUrl = entity.coverArt?.sources?.[0]?.url ?? null;
    const accessToken = state?.settings?.session?.accessToken?.trim() || null;
    const tracks: SourceTrackEntry[] = rawList
      .filter((t) => typeof t.title === 'string' && t.title.trim())
      .map((t, idx) => ({
        id: (t.uri?.split(':').pop() || t.uid || `row-${idx}`).trim(),
        title: t.title!.trim(),
        artist: (t.subtitle ?? '').replace(/\u00a0/g, ' ').trim(),
        album: null,
        durationMs: typeof t.duration === 'number' && t.duration > 0 ? t.duration : 0,
        coverUrl,
      }));
    return { title, coverUrl, tracks, accessToken };
  } catch {
    return null;
  }
}

type JsonObj = Record<string, unknown>;
const asObj = (v: unknown): JsonObj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as JsonObj) : null);
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asStr = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const asNum = (v: unknown): number | null => (typeof v === 'number' ? v : null);

function pickImageUrl(sources: unknown): string | null {
  const items = asArr(sources)
    .map((s) => ({ url: asStr(asObj(s)?.url), width: asNum(asObj(s)?.width) ?? 0 }))
    .filter((s): s is { url: string; width: number } => !!s.url)
    .sort((a, b) => a.width - b.width);
  return (items.find((s) => s.width >= 300) ?? items.at(-1))?.url ?? null;
}

/** Parses one Spotify Pathfinder `fetchPlaylist` GraphQL page cleanly. */
export function parsePathfinderPlaylistPage(root: unknown): {
  title: string | null;
  coverUrl: string | null;
  totalCount: number;
  rawCount: number;
  tracks: SourceTrackEntry[];
} {
  const data = asObj(root);
  const playlist = asObj(asObj(data?.data)?.playlistV2);
  const content = asObj(playlist?.content);
  const title = asStr(playlist?.name)?.trim() || null;
  const firstImg = asArr(asObj(playlist?.images)?.items)[0];
  const coverUrl = pickImageUrl(asObj(firstImg)?.sources);
  const rawItems = asArr(content?.items);
  const tracks: SourceTrackEntry[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const entry = asObj(rawItems[i]);
    const trackData = asObj(asObj(entry?.itemV2)?.data);
    if (!trackData) continue;
    const name = asStr(trackData.name)?.trim();
    const uri = asStr(trackData.uri) ?? asStr(trackData._uri);
    if (!name || !uri) continue;

    const artists = asArr(asObj(trackData.artists)?.items)
      .map((a) => asStr(asObj(asObj(a)?.profile)?.name)?.trim())
      .filter((n): n is string => !!n);
    const albumObj = asObj(trackData.albumOfTrack);
    const album = asStr(albumObj?.name)?.trim() || null;
    const durationMs =
      asNum(asObj(trackData.trackDuration)?.totalMilliseconds) ??
      asNum(asObj(trackData.duration)?.totalMilliseconds) ??
      0;
    const art = pickImageUrl(asObj(albumObj?.coverArt)?.sources) ?? coverUrl;

    tracks.push({
      id: uri.split(':').pop() || `pf-${i}`,
      title: name,
      artist: artists.join(', '),
      album,
      durationMs: durationMs > 0 ? durationMs : 0,
      coverUrl: art,
    });
  }

  return {
    title,
    coverUrl,
    totalCount: asNum(content?.totalCount) ?? rawItems.length,
    rawCount: rawItems.length,
    tracks,
  };
}

let cachedFetchPlaylistHash = KNOWN_FETCH_PLAYLIST_HASH;

async function refreshPathfinderPlaylistHash(): Promise<string | null> {
  try {
    const htmlRes = await fetchViaProxyWhenAvailable(DESKTOP_UA_HINT_PATH);
    if (!htmlRes.ok) return null;
    const html = await htmlRes.text();
    const bundleUrl = html.match(/https:\/\/open\.spotifycdn\.com\/cdn\/build\/web-player\/web-player\.[0-9a-f]+\.js/)?.[0];
    if (!bundleUrl) return null;
    const jsRes = await fetchViaProxyWhenAvailable(bundleUrl);
    if (!jsRes.ok) return null;
    const js = await jsRes.text();
    const hash = js.match(/["']fetchPlaylist["']\s*,\s*["']query["']\s*,\s*["']([0-9a-f]{64})["']/)?.[1] ?? null;
    if (hash) cachedFetchPlaylistHash = hash;
    return hash;
  } catch {
    return null;
  }
}

async function queryPathfinderPlaylistPage(
  id: string,
  offset: number,
  limit: number,
  token: string,
  retried = false,
): Promise<ReturnType<typeof parsePathfinderPlaylistPage> | null> {
  const res = await fetchViaProxyWhenAvailable(SPOTIFY_PATHFINDER, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'App-Platform': 'WebPlayer',
    },
    body: JSON.stringify({
      variables: { uri: `spotify:playlist:${id}`, offset, limit, enableWatchFeedEntrypoint: false },
      operationName: 'fetchPlaylist',
      extensions: { persistedQuery: { version: 1, sha256Hash: cachedFetchPlaylistHash } },
    }),
  });
  const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null;
  const errors = body?.errors?.map((e) => e.message ?? '') ?? [];
  if (errors.some((m) => /PersistedQueryNotFound/i.test(m)) && !retried) {
    const nextHash = await refreshPathfinderPlaylistHash();
    if (nextHash) return queryPathfinderPlaylistPage(id, offset, limit, token, true);
  }
  if (!res.ok || !body) return null;
  const page = parsePathfinderPlaylistPage(body);
  return page.rawCount > 0 || page.tracks.length > 0 ? page : null;
}

/**
 * Reads ALL tracks of a public Spotify playlist anonymously without any 100-song limit
 * by paginating Spotify Pathfinder (`offset = 0, 100, 200, ...`) using the session token
 * embedded in the public embed HTML, falling back to embed `__NEXT_DATA__` tracks if needed.
 */
async function fetchPublicSpotifyPlaylist(
  id: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<{ title: string; coverUrl: string | null; tracks: SourceTrackEntry[] }> {
  const url = `https://open.spotify.com/embed/playlist/${encodeURIComponent(id)}`;
  const res = await fetchViaProxyWhenAvailable(url);
  if (!res.ok) throw new Error(`Spotify playlist returned HTTP ${res.status}`);
  const html = await res.text();
  const embed = parseSpotifyEmbedHtml(html);
  if (!embed) {
    throw new Error('Could not read tracks from this Spotify playlist (it may be private or empty).');
  }

  let title = embed.title;
  let coverUrl = embed.coverUrl;
  const all: SourceTrackEntry[] = [];

  if (embed.accessToken) {
    const PAGE_SIZE = 100;
    for (let offset = 0; ; ) {
      const page = await queryPathfinderPlaylistPage(id, offset, PAGE_SIZE, embed.accessToken).catch(() => null);
      if (!page) break;
      if (page.title) title = page.title;
      if (page.coverUrl && !coverUrl) coverUrl = page.coverUrl;
      all.push(...page.tracks);
      offset += page.rawCount;
      onProgress?.({ stage: 'fetching', title, processed: all.length, total: page.totalCount || all.length, matched: 0 });
      if (page.rawCount === 0 || offset >= page.totalCount) break;
    }
  }

  const tracks = all.length > 0 ? all : embed.tracks;
  if (!tracks.length) {
    throw new Error('Could not read tracks from this Spotify playlist (it may be private or empty).');
  }
  return { title, coverUrl, tracks };
}

async function fetchDeezerPlaylist(
  id: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<{ title: string; coverUrl: string | null; tracks: SourceTrackEntry[] }> {
  const infoRes = await fetchViaProxyWhenAvailable(`https://api.deezer.com/playlist/${encodeURIComponent(id)}`);
  if (!infoRes.ok) throw new Error(`Deezer playlist returned HTTP ${infoRes.status}`);
  const info = (await infoRes.json()) as {
    title?: string;
    picture_xl?: string;
    picture_big?: string;
    nb_tracks?: number;
    error?: { message?: string };
  };
  if (info.error) throw new Error(info.error.message || 'Could not read Deezer playlist.');

  const title = (info.title || 'Imported Deezer Playlist').trim();
  const coverUrl = info.picture_xl || info.picture_big || null;
  const expectedTotal = typeof info.nb_tracks === 'number' ? info.nb_tracks : 0;
  const tracks: SourceTrackEntry[] = [];
  const PAGE_SIZE = 100;

  for (let index = 0; ; ) {
    const pageRes = await fetchViaProxyWhenAvailable(
      `https://api.deezer.com/playlist/${encodeURIComponent(id)}/tracks?index=${index}&limit=${PAGE_SIZE}`,
    );
    if (!pageRes.ok) break;
    const page = (await pageRes.json()) as {
      data?: { id?: number | string; title?: string; duration?: number; artist?: { name?: string }; album?: { title?: string; cover_xl?: string } }[];
      total?: number;
      next?: string;
    };
    const items = page.data ?? [];
    if (!items.length) break;
    for (const item of items) {
      const t = item.title?.trim();
      if (!t) continue;
      tracks.push({
        id: String(item.id ?? `dz-${tracks.length}`),
        title: t,
        artist: item.artist?.name?.trim() ?? '',
        album: item.album?.title?.trim() ?? null,
        durationMs: typeof item.duration === 'number' && item.duration > 0 ? item.duration * 1000 : 0,
        coverUrl: item.album?.cover_xl ?? coverUrl,
      });
    }
    onProgress?.({ stage: 'fetching', title, processed: tracks.length, total: page.total ?? (expectedTotal || tracks.length), matched: 0 });
    index += items.length;
    if (!page.next || (page.total != null && index >= page.total)) break;
  }

  if (!tracks.length) throw new Error('No playable tracks found in this Deezer playlist.');
  return { title, coverUrl, tracks };
}

function normalizedTitleWords(text: string): string[] {
  return parseTitle(text).words;
}

function titleAppearsInText(haystack: string, needle: string): boolean {
  const normHay = normalize(haystack).replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const parts = needle
    .split(/[,&/;]/)
    .map((p) => normalize(p).replace(/[^\p{L}\p{N}\s]/gu, ' ').trim())
    .filter((p) => p.length >= 2);
  return parts.some((artist) => new RegExp(`(?:^|\\s)${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`).test(normHay));
}

/**
 * Strict anti-mismatch verification layered over [TrackMatcher] so playlist imports
 * never save wrong artists, bootleg/slowed/8D/mashup uploads, or short-word collisions.
 */
export function isStrictImportMatch(
  candidate: MatchCandidate,
  target: MatchTarget,
  options: { fromVideoShelf?: boolean } = {},
): boolean {
  const baseScore = score(candidate, { ...target, isVideo: options.fromVideoShelf ? true : target.isVideo });
  if (baseScore === null) return false;

  // Reject altered/junk upload variants unless the source song itself asked for them.
  const candJunk = candidate.title.match(JUNK_UPLOAD_PATTERN);
  if (candJunk) {
    const srcHasJunk = target.title.match(JUNK_UPLOAD_PATTERN);
    if (!srcHasJunk) return false;
  }

  // Prevent short partial-core collisions like "Love" matching "Love Story" or "Time" vs "Time Of Our Lives".
  const wanted = parseTitle(target.title, target.artist ?? '');
  const got = parseTitle(candidate.title, candidate.artist);
  const exactCore =
    wanted.core === got.core ||
    romajiOf(wanted.core) === romajiOf(got.core) ||
    isTranslationMatch(wanted, got);

  if (!exactCore) {
    const wWords = normalizedTitleWords(target.title);
    const gWords = normalizedTitleWords(candidate.title);
    const [shorterWords, longerWords, shorterCore] =
      wWords.length <= gWords.length ? [wWords, gWords, wanted.core] : [gWords, wWords, got.core];
    const longerSet = new Set(longerWords);
    const allWholeWordsPresent = shorterWords.length > 0 && shorterWords.every((w) => longerSet.has(w));
    if (!allWholeWordsPresent) return false;
    const isCloseSingle = Math.abs(wWords.length - gWords.length) <= 1 && withinSeconds(candidate, target, 5);
    if (!isCloseSingle && ([...shorterCore].length < 6 || shorterWords.length < 2)) {
      return false;
    }
  }

  // Require artist agreement whenever the source names an artist.
  if (target.artist?.trim()) {
    const shared = sharesArtist(target.artist, candidate.artist);
    const artistInTitle = options.fromVideoShelf ? titleAppearsInText(candidate.title, target.artist) : false;
    const tightComposerOverride = !options.fromVideoShelf && withinSeconds(candidate, target, 2);
    if (!shared && !artistInTitle && !tightComposerOverride) {
      return false;
    }
  }

  // Video results must stay closely bounded in runtime unless title+artist are verified.
  if (options.fromVideoShelf && target.durationSec != null && candidate.durationSec != null) {
    const drift = Math.abs(candidate.durationSec - target.durationSec);
    if (drift > 40) return false;
    if (drift > 20 && !sharesArtist(target.artist ?? '', candidate.artist)) return false;
  }

  return true;
}

/** Picks the highest-scoring strictly verified candidate from a list. */
export function pickStrictMatch<T extends MatchCandidate>(
  candidates: T[],
  target: MatchTarget,
  options: { fromVideoShelf?: boolean } = {},
): T | null {
  const verified = candidates.filter((c) => isStrictImportMatch(c, target, options));
  if (!verified.length) return null;
  return ranked(verified, { ...target, isVideo: options.fromVideoShelf ? true : target.isVideo })[0] ?? null;
}

function musicItemToTrack(item: MusicItem): Track {
  return {
    videoId: item.id,
    title: item.title,
    artists: item.artists,
    album: item.album,
    durationSec: item.durationSec,
    explicit: item.explicit,
    thumbnail: item.thumbnail,
    index: null,
    plays: null,
  };
}

interface ItunesEnrichment {
  title: string;
  artist: string;
  album: string | null;
  durationSec: number | null;
  artworkUrl: string | null;
}

const itunesCache = new Map<string, ItunesEnrichment | null>();

async function lookupItunesMetadata(entry: SourceTrackEntry): Promise<ItunesEnrichment | null> {
  const key = `${entry.title}|${entry.artist}`.toLowerCase();
  if (itunesCache.has(key)) return itunesCache.get(key)!;
  try {
    const clean = cleanTrackTitle(entry.title) || entry.title;
    const primaryArtist = entry.artist.split(',')[0]?.trim() ?? '';
    const term = [clean, primaryArtist].filter(Boolean).join(' ');
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=5`;
    const res = await fetchViaProxyWhenAvailable(url);
    if (!res.ok) {
      itunesCache.set(key, null);
      return null;
    }
    const body = (await res.json()) as {
      results?: { trackName?: string; artistName?: string; collectionName?: string; trackTimeMillis?: number; artworkUrl100?: string }[];
    };
    const results = body.results ?? [];
    const target: MatchTarget = {
      title: entry.title,
      artist: entry.artist,
      album: entry.album,
      durationSec: entry.durationMs > 0 ? Math.round(entry.durationMs / 1000) : null,
    };
    const match = pickStrictMatch(
      results
        .filter((r) => !!r.trackName && !!r.artistName)
        .map((r) => ({
          title: r.trackName!,
          artist: r.artistName!,
          album: r.collectionName ?? null,
          durationSec: typeof r.trackTimeMillis === 'number' && r.trackTimeMillis > 0 ? Math.round(r.trackTimeMillis / 1000) : null,
          artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace(/\d+x\d+bb/i, '600x600bb') : null,
        })),
      target,
    );
    itunesCache.set(key, match);
    return match;
  } catch {
    itunesCache.set(key, null);
    return null;
  }
}

/**
 * Resolves a single imported track across multiple catalogue and streaming sources
 * (YouTube Music Songs -> alternate queries / iTunes enrichment -> YTM General Search ->
 * Main YouTube Search -> enabled HTTP Audio Addons) with strict mismatch filtering.
 */
async function matchSourceEntryMultiSource(
  entry: SourceTrackEntry,
  fallbackCover: string | null,
  cache: Map<string, Track | null>,
): Promise<Track | null> {
  const cacheKey = `${normalize(entry.title)}|${normalize(entry.artist)}|${Math.round(entry.durationMs / 1000)}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    return cached ? { ...cached, thumbnail: cached.thumbnail ?? entry.coverUrl ?? fallbackCover } : null;
  }

  let target: MatchTarget = {
    title: entry.title,
    artist: entry.artist,
    album: entry.album,
    durationSec: entry.durationMs > 0 ? Math.round(entry.durationMs / 1000) : null,
  };

  const withBestArtwork = (track: Track): Track => ({
    ...track,
    thumbnail: track.thumbnail ?? entry.coverUrl ?? fallbackCover,
  });

  // Source 1: YouTube Music Songs catalogue (primary query).
  const cleanTitle = cleanTrackTitle(entry.title) || entry.title;
  const primaryQuery = [cleanTitle, entry.artist].filter((s) => s.trim()).join(' ');
  const ytmPrimary = await searchSongs(primaryQuery).catch(() => [] as Track[]);
  const hit1 = pickStrictMatch(ytmPrimary.map((t) => ({ ...candidateOf(t), track: t })), target);
  if (hit1) {
    const out = withBestArtwork(hit1.track);
    cache.set(cacheKey, out);
    return out;
  }

  // Source 2: Alternate TrackMatcher queries + iTunes metadata enrichment -> YouTube Music Songs.
  const altQueries = buildMatcherQueries(target).filter((q) => q !== primaryQuery);
  for (const q of altQueries.slice(0, 2)) {
    const ytmAlt = await searchSongs(q).catch(() => [] as Track[]);
    const hitAlt = pickStrictMatch(ytmAlt.map((t) => ({ ...candidateOf(t), track: t })), target);
    if (hitAlt) {
      const out = withBestArtwork(hitAlt.track);
      cache.set(cacheKey, out);
      return out;
    }
  }

  const enriched = await lookupItunesMetadata(entry);
  if (enriched) {
    target = {
      title: enriched.title || target.title,
      artist: target.artist || enriched.artist,
      album: target.album ?? enriched.album,
      durationSec: target.durationSec ?? enriched.durationSec,
    };
    const enrichedQuery = [enriched.title, enriched.artist].filter(Boolean).join(' ');
    if (enrichedQuery && enrichedQuery !== primaryQuery) {
      const ytmEnriched = await searchSongs(enrichedQuery).catch(() => [] as Track[]);
      const hitEnriched = pickStrictMatch(ytmEnriched.map((t) => ({ ...candidateOf(t), track: t })), target);
      if (hitEnriched) {
        const out = { ...hitEnriched.track, thumbnail: hitEnriched.track.thumbnail ?? enriched.artworkUrl ?? entry.coverUrl ?? fallbackCover };
        cache.set(cacheKey, out);
        return out;
      }
    }
  }

  // Source 3: YouTube Music general search (Top Result + Songs + verified Music Videos).
  const general = await fetchSearch(primaryQuery).catch(() => null);
  if (general) {
    const songItems = [...general.top, ...general.songs].filter((i) => i.kind === 'song').map(musicItemToTrack);
    const hitGeneralSong = pickStrictMatch(songItems.map((t) => ({ ...candidateOf(t), track: t })), target);
    if (hitGeneralSong) {
      const out = withBestArtwork(hitGeneralSong.track);
      cache.set(cacheKey, out);
      return out;
    }
    const videoItems = [...general.top, ...general.videos].filter((i) => i.kind === 'video').map(musicItemToTrack);
    const hitGeneralVideo = pickStrictMatch(videoItems.map((t) => ({ ...candidateOf(t), track: t })), target, { fromVideoShelf: true });
    if (hitGeneralVideo) {
      const out = withBestArtwork(hitGeneralVideo.track);
      cache.set(cacheKey, out);
      return out;
    }
  }

  // Source 4: Main YouTube video search (label / - Topic uploads missing from YTMUSIC shelves).
  const mainVideos = await searchMainVideos(primaryQuery).catch(() => [] as Track[]);
  const hitMain = pickStrictMatch(mainVideos.map((t) => ({ ...candidateOf(t), track: t })), target, { fromVideoShelf: true });
  if (hitMain) {
    const out = withBestArtwork(hitMain.track);
    cache.set(cacheKey, out);
    return out;
  }

  // Source 5: User-configured HTTP Audio Addons (resolved dynamically at playback via hint).
  const { addons, quality } = useAddons.getState();
  const enabledAddons = addons.filter((a) => a.enabled);
  for (const addon of enabledAddons) {
    const addonHits = await searchAddon(addon, primaryQuery, quality).catch(() => []);
    const verified = pickStrictMatch(addonHits, target);
    if (verified) {
      const out: Track = {
        videoId: `addon:${addon.id}:${verified.id}`,
        title: verified.title,
        artists: verified.artist ? verified.artist.split(/,\s*/).map((name) => ({ name, id: null })) : [{ name: entry.artist, id: null }],
        album: verified.album ? { name: verified.album, id: null } : entry.album ? { name: entry.album, id: null } : null,
        durationSec: verified.durationSec ?? target.durationSec ?? null,
        explicit: false,
        thumbnail: verified.artworkURL ?? verified.albumArtworkURL ?? entry.coverUrl ?? fallbackCover,
        index: null,
        plays: null,
      };
      cache.set(cacheKey, out);
      return out;
    }
  }

  cache.set(cacheKey, null);
  return null;
}

async function importYouTubePlaylist(
  rawId: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportedPlaylistResult> {
  onProgress?.({ stage: 'fetching', processed: 0, total: 0, matched: 0 });
  const { page, more } = await fetchPlaylist(rawId);
  const allTracks: Track[] = [];
  const seenIds = new Set<string>();

  const pushUnique = (batch: Track[]): number => {
    let added = 0;
    for (const track of batch) {
      if (!track.videoId || seenIds.has(track.videoId)) continue;
      seenIds.add(track.videoId);
      allTracks.push(track);
      added++;
    }
    return added;
  };

  pushUnique(page.tracks);
  onProgress?.({ stage: 'fetching', title: page.title, processed: allTracks.length, total: allTracks.length, matched: allTracks.length });

  let nextPage = more;
  let consecutiveEmpty = 0;
  // Paginate until every continuation page finishes with zero track cap.
  while (nextPage) {
    const chunk = await nextPage().catch(() => null);
    if (!chunk) break;
    const added = pushUnique(chunk.data);
    nextPage = chunk.next;
    consecutiveEmpty = added === 0 ? consecutiveEmpty + 1 : 0;
    if (consecutiveEmpty >= 2) break;
    onProgress?.({ stage: 'fetching', title: page.title, processed: allTracks.length, total: allTracks.length, matched: allTracks.length });
  }

  if (!allTracks.length) throw new Error('No playable tracks found in this YouTube playlist.');
  return {
    provider: 'youtube',
    title: page.title || 'Imported YouTube Playlist',
    tracks: allTracks,
    totalSourceTracks: allTracks.length,
    skippedCount: 0,
  };
}

async function resolveEntriesMultiSource(
  provider: 'spotify' | 'deezer',
  title: string,
  fallbackCover: string | null,
  sourceTracks: SourceTrackEntry[],
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportedPlaylistResult> {
  const total = sourceTracks.length;
  const resolved: (Track | null)[] = new Array(total).fill(null);
  const matchCache = new Map<string, Track | null>();
  let processed = 0;
  let matched = 0;
  let cursor = 0;
  const CONCURRENCY = 4;

  const worker = async () => {
    while (cursor < total) {
      const i = cursor++;
      const entry = sourceTracks[i]!;
      const hit = await matchSourceEntryMultiSource(entry, fallbackCover, matchCache);
      resolved[i] = hit;
      processed++;
      if (hit) matched++;
      onProgress?.({ stage: 'matching', title, processed, total, matched });
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()));
  const tracks = resolved.filter((t): t is Track => !!t);
  if (!tracks.length) {
    throw new Error(`Could not match any songs from this ${provider === 'spotify' ? 'Spotify' : 'Deezer'} playlist without mismatching.`);
  }
  return {
    provider,
    title,
    tracks,
    totalSourceTracks: total,
    skippedCount: total - tracks.length,
  };
}

async function importSpotifyPlaylist(
  id: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportedPlaylistResult> {
  onProgress?.({ stage: 'fetching', processed: 0, total: 0, matched: 0 });

  let title = 'Imported Spotify Playlist';
  let fallbackCover: string | null = null;
  let sourceTracks: SourceTrackEntry[] = [];

  if (getBridge()) {
    try {
      const [info, items] = await Promise.all([
        fetchSpotifyPlaylistInfo(id),
        fetchSpotifyTracks(id, (soFar, total) => {
          onProgress?.({ stage: 'fetching', title, processed: soFar.length, total, matched: 0 });
        }),
      ]);
      title = info.name || title;
      fallbackCover = info.imageUrl ?? null;
      sourceTracks = items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.album ?? null,
        durationMs: item.durationMs,
        coverUrl: item.imageUrl ?? fallbackCover,
      }));
    } catch {
      // Fall back to anonymous Pathfinder + Embed when extension session is signed out or unavailable.
    }
  }

  if (sourceTracks.length === 0) {
    const publicData = await fetchPublicSpotifyPlaylist(id, onProgress);
    title = publicData.title;
    fallbackCover = publicData.coverUrl;
    sourceTracks = publicData.tracks;
  }

  return resolveEntriesMultiSource('spotify', title, fallbackCover, sourceTracks, onProgress);
}

/** Imports a playlist from YouTube Music, Spotify, or Deezer with no track limit and strict matching. */
export async function importExternalPlaylist(
  input: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportedPlaylistResult> {
  const ref = parsePlaylistInput(input);
  if (!ref) {
    throw new Error('Paste a valid YouTube Music, Spotify, or Deezer playlist link/ID.');
  }
  if (ref.provider === 'youtube') return importYouTubePlaylist(ref.id, onProgress);
  if (ref.provider === 'spotify') return importSpotifyPlaylist(ref.id, onProgress);
  const dz = await fetchDeezerPlaylist(ref.id, onProgress);
  return resolveEntriesMultiSource('deezer', dz.title, dz.coverUrl, dz.tracks, onProgress);
}
