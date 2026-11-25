import { getProxyUrl, proxiedUrl } from '@/lib/iosProxy';

interface ItunesTrackResult {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
}

const MAX_CACHE = 200;
const artCache = new Map<string, string | null>();

function setBounded(key: string, value: string | null) {
  artCache.delete(key);
  artCache.set(key, value);
  if (artCache.size > MAX_CACHE) {
    const oldest = artCache.keys().next().value;
    if (oldest !== undefined) artCache.delete(oldest);
  }
}

/** True when artwork is absent or comes from a wide YouTube video frame rather than square cover art. */
export function isVideoOrMissingArt(url: string | null | undefined, wide = false): boolean {
  if (!url || wide) return true;
  return /ytimg\.com|youtube\.com/i.test(url);
}

/** Strips video noise like "(Official Music Video)", "[4K]", or "From '...'" for cleaner cover matching. */
export function cleanTrackTitle(raw: string): string {
  return raw
    .replace(
      /\s*[\[(](?:official\s*)?(?:music\s*)?(?:video|amv|pmv|lyric\s*video|audio|hd|4k|8k|full\s*song|full\s*video|mv|from\s+[^)\]]+)[\])]/gi,
      ' ',
    )
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(hit: ItunesTrackResult, title: string, artist: string, album?: string | null): number {
  const hitTitle = normalize(hit.trackName ?? '');
  const hitArtist = normalize(hit.artistName ?? '');
  const hitCollection = normalize(hit.collectionName ?? '');
  const qTitle = normalize(title);
  const qArtist = normalize(artist);

  if (!hitTitle || (!hit.artworkUrl100 && !hit.artworkUrl60)) return -1;

  let score = 0;
  if (hitTitle === qTitle) score += 50;
  else if (hitTitle.includes(qTitle) || qTitle.includes(hitTitle)) score += 28;
  else {
    const tokens = qTitle.split(' ').filter((w) => w.length > 2);
    const hits = tokens.filter((w) => hitTitle.includes(w)).length;
    score += hits * 8;
  }

  if (qArtist) {
    const firstArtist = qArtist.split(/[,&]|feat|ft/)[0]?.trim() ?? qArtist;
    if (hitArtist.includes(firstArtist) || firstArtist.includes(hitArtist)) score += 35;
    else {
      const aTokens = firstArtist.split(' ').filter((w) => w.length > 2);
      if (aTokens.some((w) => hitArtist.includes(w))) score += 16;
    }
  }

  if (album && normalize(album) && hitCollection.includes(normalize(album))) score += 15;

  // Penalize tribute/karaoke covers unless the query itself asked for them.
  if (/\b(karaoke|tribute|instrumental|cover|ringtone|lullaby)\b/i.test(hit.trackName ?? '') && !/\b(karaoke|cover|instrumental)\b/i.test(title)) {
    score -= 40;
  }

  return score;
}

function highResItunesUrl(raw: string): string {
  return raw.replace(/\/\d+x\d+[^/]*\.(jpg|jpeg|png|webp)$/i, '/1000x1000bb.jpg');
}

async function queryItunes(term: string, signal?: AbortSignal): Promise<ItunesTrackResult[]> {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=6`;
  const run = async (url: string) => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`);
    const data = (await res.json()) as { results?: ItunesTrackResult[] };
    return Array.isArray(data.results) ? data.results : [];
  };
  try {
    return await run(endpoint);
  } catch (err) {
    if (signal?.aborted) throw err;
    if (!getProxyUrl()) throw err;
    return run(proxiedUrl(endpoint));
  }
}

/**
 * Fetches a high-resolution (1000x1000) square album cover URL for a song via
 * iTunes public search when YouTube only provides a wide video thumbnail.
 */
export async function resolveAutoAlbumArt(
  title: string,
  artist: string,
  album?: string | null,
  signal?: AbortSignal,
): Promise<string | null> {
  const cleanedTitle = cleanTrackTitle(title);
  if (!cleanedTitle) return null;

  const primaryArtist = artist.split(/[,&]/)[0]?.trim() ?? '';
  const key = `${normalize(cleanedTitle)}|${normalize(primaryArtist)}|${normalize(album ?? '')}`;
  if (artCache.has(key)) return artCache.get(key) ?? null;

  const queries = [
    [cleanedTitle, primaryArtist].filter(Boolean).join(' '),
    album ? `${cleanedTitle} ${album}` : cleanedTitle,
  ];

  let bestUrl: string | null = null;
  let bestScore = 25;

  for (const term of queries) {
    if (!term || signal?.aborted) break;
    try {
      const results = await queryItunes(term, signal);
      for (const hit of results) {
        const s = scoreMatch(hit, cleanedTitle, primaryArtist, album);
        if (s > bestScore) {
          bestScore = s;
          const rawArt = hit.artworkUrl100 ?? hit.artworkUrl60;
          bestUrl = rawArt ? highResItunesUrl(rawArt) : null;
        }
      }
      if (bestUrl && bestScore >= 55) break;
    } catch {
      // Ignore network/abort errors cleanly and keep existing art.
    }
  }

  if (!signal?.aborted) setBounded(key, bestUrl);
  return bestUrl;
}
