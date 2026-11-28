import type { Track } from '@/data/music/types';
import { getTopRepeatedTracks, useLocalLibrary } from '@/data/music/localLibrary';
import { computeTasteProfile, inferGenreSync, scoreCandidate } from '@/data/music/tasteProfile';
import { searchExternalTracks } from '@/data/sources/externalSources';
import { type Candidate, extendStation, artistLine, isSameRecording } from '@/playback/queue/builder';
import { fetchRadio, searchSongs, searchMainVideos } from '@/data/music/api';

let radioCycleCursor = 0;

export interface GenreRadioResult {
  tracks: Track[];
  genre: string;
  sourceTitle: string;
}

const genreCache = new Map<string, string>();

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect the musical genre of a track using iTunes Music API with local rule fallbacks.
 */
export async function detectTrackGenre(seed: Track): Promise<string> {
  const cacheKey = `${seed.title.trim().toLowerCase()}__${artistLine(seed).trim().toLowerCase()}`;
  const cached = genreCache.get(cacheKey);
  if (cached) return cached;

  // Step 1: Quick check with local heuristic taxonomy
  const quickGenre = inferGenreSync(seed);
  if (quickGenre) {
    genreCache.set(cacheKey, quickGenre);
    return quickGenre;
  }

  // Step 2: Query iTunes Search API (fast, authoritative, 2.5s timeout)
  try {
    const cleanedTitle = cleanString(seed.title);
    const primaryArtist = cleanString(seed.artists[0]?.name ?? '');
    const term = encodeURIComponent(`${cleanedTitle} ${primaryArtist}`.trim());
    if (term) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { results?: Array<{ primaryGenreName?: string }> };
        const genreName = data.results?.[0]?.primaryGenreName;
        if (genreName) {
          const mapped = mapItunesGenre(genreName);
          genreCache.set(cacheKey, mapped);
          return mapped;
        }
      }
    }
  } catch {
    // Timeout or network error; fall through to fallback
  }

  // Step 3: Default fallback
  const fallback = seed.artists[0]?.name ? `${seed.artists[0].name} Style` : 'Similar Music';
  genreCache.set(cacheKey, fallback);
  return fallback;
}

function mapItunesGenre(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('bollywood') || lower.includes('indian') || lower.includes('hindi')) return 'Bollywood';
  if (lower.includes('punjabi')) return 'Punjabi';
  if (lower.includes('dance') || lower.includes('electronic') || lower.includes('house') || lower.includes('techno')) {
    return 'Dance / EDM';
  }
  if (lower.includes('hip-hop') || lower.includes('rap') || lower.includes('trap')) return 'Hip-Hop';
  if (lower.includes('rock') || lower.includes('metal') || lower.includes('punk') || lower.includes('grunge')) {
    return 'Rock';
  }
  if (lower.includes('pop') || lower.includes('teen pop')) return 'Pop';
  if (lower.includes('r&b') || lower.includes('soul') || lower.includes('funk')) return 'R&B / Soul';
  if (lower.includes('soundtrack') || lower.includes('score')) return 'Soundtrack';
  if (lower.includes('country')) return 'Country';
  if (lower.includes('classical')) return 'Classical';
  if (lower.includes('jazz') || lower.includes('blues')) return 'Jazz';
  if (lower.includes('folk') || lower.includes('acoustic')) return 'Acoustic / Folk';
  return raw;
}

/**
 * Automatically fetch and queue tracks matching the same genre and vibe as the seed track.
 * Uses a multi-tier fallback architecture:
 * Tier 1: YouTube Music Up Next Radio
 * Tier 2: YouTube Music Songs shelf by genre & artist
 * Tier 3: General YouTube Video search for top genre hits
 */
export async function fetchSameGenreTracks(
  seed: Track,
  currentQueue: readonly Track[],
  needed: number,
): Promise<GenreRadioResult> {
  const genre = await detectTrackGenre(seed);
  const artist = seed.artists[0]?.name ?? '';
  const candidates: Candidate[] = [];
  let seedIsVideo = false;

  // Tier 1: Try official YouTube Music Radio (skip for external non-YT IDs like audius:/itunes:)
  if (!seed.videoId.includes(':')) {
    try {
      const radio = await fetchRadio(seed.videoId);
      seedIsVideo = radio.seedIsVideo;
      candidates.push(...radio.candidates);
    } catch {
      // Radio unavailable or rate-limited; proceed to Tier 2
    }
  }

  // Compute user's multi-signal taste profile (plays, completions, skips, favorites, playlists)
  const lib = useLocalLibrary.getState();
  const profile = computeTasteProfile({
    recentTracks: lib.recentTracks,
    favorites: lib.favorites,
    playlists: lib.playlists,
  });

  // Blend in cyclic repeated user songs, prioritizing ones matching the active genre
  const repeatedAll = getTopRepeatedTracks(lib.recentTracks, 14).filter(
    (t) =>
      !profile.skippedIds.has(t.videoId) &&
      !isSameRecording(t, seed) &&
      !currentQueue.some((q) => isSameRecording(q, t)),
  );
  const repeatedSameGenre = repeatedAll.filter((t) => inferGenreSync(t) === genre);
  const repeatedPool = repeatedSameGenre.length > 0 ? repeatedSameGenre : repeatedAll;
  if (repeatedPool.length > 0) {
    const pick = repeatedPool[radioCycleCursor % repeatedPool.length]!;
    radioCycleCursor = (radioCycleCursor + 1) % repeatedPool.length;
    candidates.push({ track: pick, isVideo: false });
  }

  // Tier 2: Search for same-genre + top taste tracks if radio returned too few
  if (candidates.length < needed * 2) {
    const searchQueries: string[] = [];
    if (artist && genre !== 'Similar Music' && !genre.endsWith('Style')) {
      searchQueries.push(`${artist} ${genre}`);
      searchQueries.push(`${genre} hit songs`);
    } else if (artist) {
      searchQueries.push(`${artist} hit songs`);
      searchQueries.push(`${seed.title} radio mix`);
    } else {
      searchQueries.push(`${genre} hits`);
    }
    const topTasteArtist = profile.topArtists[0]?.artist;
    if (topTasteArtist && topTasteArtist.toLowerCase() !== artist.toLowerCase()) {
      searchQueries.push(`${topTasteArtist} ${genre !== 'Similar Music' && !genre.endsWith('Style') ? genre : 'hits'}`);
    }

    const searchResults = await Promise.allSettled(
      searchQueries.map(async (query) => {
        try {
          const songs = await searchSongs(query);
          if (songs.length) return songs;
        } catch {
          // ignore
        }
        try {
          return await searchMainVideos(query);
        } catch {
          return [];
        }
      }),
    );

    for (const res of searchResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const track of res.value) {
          if (!candidates.some((c) => isSameRecording(c.track, track))) {
            candidates.push({ track, isVideo: false });
          }
        }
      }
    }
  }

  // Made by Rohan JM aka TheRedDragon
  // Rank candidates by precision taste score (genre match + user taste affinity - skips)
  const rankedCandidates = [...candidates]
    .filter((c) => !profile.skippedIds.has(c.track.videoId))
    .sort(
      (a, b) =>
        scoreCandidate(b.track, profile, { seedTrack: seed, seedGenre: genre }) -
        scoreCandidate(a.track, profile, { seedTrack: seed, seedGenre: genre }),
    );

  // Filter and deduplicate against existing queue using extendStation
  const extended = extendStation(currentQueue, rankedCandidates, needed, seedIsVideo);

  // If still empty (e.g., YouTube blocked or highly restrictive filters), fall back to external sources + broad video search
  if (!extended.length) {
    try {
      const fallbackQuery = artist ? `${artist} ${genre !== 'Similar Music' ? genre : 'songs'}` : `${seed.title} mix`;
      const [externalRes, videoRes] = await Promise.allSettled([
        searchExternalTracks(fallbackQuery, needed * 2),
        searchMainVideos(fallbackQuery),
      ]);
      const fallbackCandidates: Candidate[] = [];
      if (externalRes.status === 'fulfilled') {
        fallbackCandidates.push(...externalRes.value.map((t) => ({ track: t, isVideo: false })));
      }
      if (videoRes.status === 'fulfilled') {
        fallbackCandidates.push(...videoRes.value.map((t) => ({ track: t, isVideo: false })));
      }
      const fallbackExtended = extendStation(currentQueue, fallbackCandidates, needed, seedIsVideo);
      extended.push(...fallbackExtended);
    } catch {
      // ignore
    }
  }

  const sourceTitle = genre.endsWith('Style') || genre === 'Similar Music'
    ? `${artist || seed.title} Radio`
    : `${genre} Radio • ${seed.title}`;

  return {
    tracks: extended,
    genre,
    sourceTitle,
  };
}
