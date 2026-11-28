import { detectTrackGenre } from '@/data/music/genreRadio';
import { getTopRepeatedTracks, nextCyclicSeedTrack } from '@/data/music/localLibrary';
import { computeTasteProfile, scoreCandidate, type TasteProfile } from '@/data/music/tasteProfile';
import type { MusicItem, Shelf, Track } from '@/data/music/types';
import {
  fetchAudiusTrendingTracks,
  fetchItunesChartTracks,
  searchAudiusTracks,
  searchItunesTracks,
} from './externalSources';

export interface HomeRecommendationInput {
  recentTracks: Track[];
  favorites?: Track[];
  playlists?: Array<{ tracks: Track[] }>;
}

function rankByTaste(
  tracks: Track[],
  profile: TasteProfile,
  excludeIds: Set<string>,
  options?: { seedTrack?: Track | null; seedGenre?: string | null; limit?: number },
): Track[] {
  const ranked = tracks
    .filter((t) => !profile.skippedIds.has(t.videoId))
    .sort(
      (a, b) =>
        scoreCandidate(b, profile, {
          seedTrack: options?.seedTrack,
          seedGenre: options?.seedGenre,
        }) -
        scoreCandidate(a, profile, {
          seedTrack: options?.seedTrack,
          seedGenre: options?.seedGenre,
        }),
    );
  return dedupeTracks(ranked, excludeIds, options?.limit ?? 16);
}

function trackToMusicItem(track: Track, sourceTag: string): MusicItem {
  const artistNames = track.artists.map((a) => a.name).filter(Boolean).join(', ');
  return {
    kind: 'song',
    id: track.videoId,
    title: track.title,
    subtitle: artistNames ? `${artistNames} • ${sourceTag}` : sourceTag,
    artists: track.artists,
    album: track.album,
    thumbnail: track.thumbnail,
    wide: false,
    durationSec: track.durationSec,
    explicit: track.explicit,
  };
}

function dedupeTracks(tracks: Track[], excludeIds: Set<string>, limit = 16): Track[] {
  const seen = new Set<string>(excludeIds);
  const seenTitles = new Set<string>();
  const out: Track[] = [];
  for (const t of tracks) {
    const normTitle = `${t.title.toLowerCase()}::${t.artists[0]?.name.toLowerCase() ?? ''}`;
    if (seen.has(t.videoId) || seenTitles.has(normTitle)) continue;
    seen.add(t.videoId);
    seenTitles.add(normTitle);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

function timeOfDayVibe(
  slotGenres: Array<{ genre: string; score: number }>,
  slotArtists: Array<{ artist: string; score: number }>,
): { title: string; strapline: string; query: string } {
  const hour = new Date().getHours();
  const learnedGenre = slotGenres[0]?.genre;
  const learnedArtist = slotArtists[0]?.artist;
  const learnedQuery = [learnedArtist, learnedGenre].filter(Boolean).join(' ').trim();

  if (hour >= 5 && hour < 12) {
    return {
      title: learnedGenre ? `Your Morning Habit • ${learnedGenre}` : 'Morning Acoustic & Fresh',
      strapline: learnedGenre ? 'ADAPTED TO YOUR MORNING STREAMING' : 'MULTI-SOURCE • ITUNES & AUDIUS',
      query: learnedQuery || 'acoustic chill morning indie',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      title: learnedGenre ? `Your Afternoon Habit • ${learnedGenre}` : 'Afternoon Energy & Hits',
      strapline: learnedGenre ? 'ADAPTED TO YOUR AFTERNOON STREAMING' : 'MULTI-SOURCE • ITUNES & AUDIUS',
      query: learnedQuery || 'bollywood punjabi pop hits',
    };
  }
  if (hour >= 17 && hour < 22) {
    return {
      title: learnedGenre ? `Your Evening Ritual • ${learnedGenre}` : 'Evening Groove & Hits',
      strapline: learnedGenre ? 'ADAPTED TO YOUR EVENING STREAMING' : 'MULTI-SOURCE • ITUNES & AUDIUS',
      query: learnedQuery || 'bollywood indie evening chill',
    };
  }
  return {
    title: learnedGenre ? `Your Late Night Habit • ${learnedGenre}` : 'Late Night Vibes & Lo-Fi',
    strapline: learnedGenre ? 'ADAPTED TO YOUR LATE-NIGHT STREAMING' : 'MULTI-SOURCE • ITUNES & AUDIUS',
    query: learnedQuery || 'late night lofi synthwave chill',
  };
}

/**
 * Builds rich, personalized + multi-source Home recommendation shelves using
 * Audius Discovery Network and Apple iTunes Charts/Search alongside YouTube.
 */
export async function buildMultiSourceHomeShelves(
  input: Track[] | HomeRecommendationInput,
): Promise<Shelf[]> {
  const recentTracks = Array.isArray(input) ? input : input.recentTracks;
  const favorites = Array.isArray(input) ? [] : (input.favorites ?? []);
  const playlists = Array.isArray(input) ? [] : (input.playlists ?? []);

  const profile = computeTasteProfile({ recentTracks, favorites, playlists });
  const excludeIds = new Set([...recentTracks.map((t) => t.videoId), ...profile.skippedIds]);
  const repeatedTop = getTopRepeatedTracks(recentTracks, 12).filter((t) => !profile.skippedIds.has(t.videoId));
  const cyclicSeed = nextCyclicSeedTrack(recentTracks) ?? recentTracks[0] ?? favorites[0] ?? null;
  const seedArtist = cyclicSeed?.artists.find((a) => a.name)?.name ?? null;
  const seedGenre = cyclicSeed ? await detectTrackGenre(cyclicSeed).catch(() => null) : null;

  const topGenre1 = profile.topGenres[0]?.genre ?? null;
  const topGenre2 = profile.topGenres[1]?.genre ?? null;
  const topArtist1 = profile.topArtists[0]?.artist ?? null;
  const vibe = timeOfDayVibe(profile.slotGenres, profile.slotArtists);

  const [
    audiusTrending,
    itunesIndia,
    itunesGlobal,
    vibeItunes,
    vibeAudius,
    personalItunes,
    personalAudius,
    genreItunes,
    tasteGenreItunes,
    tasteGenreAudius,
    tasteArtistItunes,
  ] = await Promise.all([
    fetchAudiusTrendingTracks(16),
    fetchItunesChartTracks('in', 16),
    fetchItunesChartTracks('us', 16),
    searchItunesTracks(vibe.query, 12),
    searchAudiusTracks(vibe.query, 10),
    seedArtist ? searchItunesTracks(seedArtist, 12) : Promise.resolve([]),
    seedArtist ? searchAudiusTracks(seedArtist, 8) : Promise.resolve([]),
    seedGenre && seedGenre !== 'Similar Music' && !seedGenre.endsWith('Style')
      ? searchItunesTracks(`${seedGenre} hits`, 12)
      : Promise.resolve([]),
    topGenre1 ? searchItunesTracks(`${topGenre1} hits`, 14) : Promise.resolve([]),
    topGenre1 ? searchAudiusTracks(topGenre1, 10) : Promise.resolve([]),
    topArtist1 && topArtist1.toLowerCase() !== (seedArtist ?? '').toLowerCase()
      ? searchItunesTracks(topArtist1, 12)
      : Promise.resolve([]),
  ]);

  const shelves: Shelf[] = [];
  // Made by Rohan JM aka TheRedDragon

  if (topGenre1 && (tasteGenreItunes.length > 0 || tasteGenreAudius.length > 0)) {
    const tasteTracks = rankByTaste([...tasteGenreItunes, ...tasteGenreAudius], profile, excludeIds, {
      seedGenre: topGenre1,
      limit: 16,
    });
    if (tasteTracks.length > 0) {
      shelves.push({
        title: topGenre2 ? `Your Sound • ${topGenre1} & ${topGenre2}` : `Your Sound • ${topGenre1}`,
        strapline: 'PRECISION TASTE PROFILE',
        layout: 'square',
        items: tasteTracks.map((t) => trackToMusicItem(t, t.videoId.startsWith('audius:') ? 'Audius' : 'Taste Match')),
        seeAll: null,
      });
    }
  }

  if (repeatedTop.length > 0) {
    shelves.push({
      title: 'On Repeat • Your Heavy Rotation',
      strapline: 'CYCLIC REPLAY FAVORITES',
      layout: 'tracks',
      items: repeatedTop.map((t) => trackToMusicItem(t, t.videoId.startsWith('audius:') ? 'Audius' : 'Rotation')),
      seeAll: null,
    });
  }

  if (seedArtist) {
    const personal = rankByTaste([...personalItunes, ...personalAudius], profile, excludeIds, {
      seedTrack: cyclicSeed,
      seedGenre: seedGenre ?? topGenre1,
      limit: 16,
    });
    if (personal.length > 0) {
      shelves.push({
        title: `Because You Replay ${seedArtist}`,
        strapline: 'CYCLIC PERSONALIZED MIX',
        layout: 'tracks',
        items: personal.map((t) => trackToMusicItem(t, t.videoId.startsWith('audius:') ? 'Audius' : 'iTunes')),
        seeAll: null,
      });
    }
  }

  if (seedGenre && genreItunes.length > 0) {
    const genreMix = rankByTaste(genreItunes, profile, excludeIds, {
      seedTrack: cyclicSeed,
      seedGenre,
      limit: 16,
    });
    if (genreMix.length > 0) {
      shelves.push({
        title: `${seedGenre} Mix • Based on Your Vibe`,
        strapline: 'GENRE-MATCHED RECOMMENDATIONS',
        layout: 'square',
        items: genreMix.map((t) => trackToMusicItem(t, 'Genre Mix')),
        seeAll: null,
      });
    }
  }

  if (topArtist1 && tasteArtistItunes.length > 0) {
    const artistDiscovery = rankByTaste(tasteArtistItunes, profile, excludeIds, {
      seedGenre: topGenre1,
      limit: 14,
    });
    if (artistDiscovery.length > 0) {
      const displayArtist = topArtist1.replace(/\b\w/g, (c) => c.toUpperCase());
      shelves.push({
        title: `More From ${displayArtist}`,
        strapline: 'TOP ARTIST AFFINITY',
        layout: 'tracks',
        items: artistDiscovery.map((t) => trackToMusicItem(t, 'For You')),
        seeAll: null,
      });
    }
  }

  const trending = rankByTaste(audiusTrending, profile, excludeIds, { seedGenre: topGenre1, limit: 16 });
  if (trending.length > 0) {
    shelves.push({
      title: 'Trending on Audius',
      strapline: 'DIRECT 320KBPS HI-FI • NO EXTENSION NEEDED',
      layout: 'square',
      items: trending.map((t) => trackToMusicItem(t, 'Audius')),
      seeAll: null,
    });
  }

  const topCharts = rankByTaste([...itunesIndia.slice(0, 10), ...itunesGlobal.slice(0, 10)], profile, excludeIds, {
    seedGenre: topGenre1,
    limit: 16,
  });
  if (topCharts.length > 0) {
    shelves.push({
      title: 'Top Charts • India & Global',
      strapline: 'APPLE ITUNES CHARTS',
      layout: 'tracks',
      items: topCharts.map((t) => trackToMusicItem(t, 'iTunes Chart')),
      seeAll: null,
    });
  }

  const vibeTracks = rankByTaste([...vibeAudius, ...vibeItunes], profile, excludeIds, {
    seedGenre: topGenre1,
    limit: 16,
  });
  if (vibeTracks.length > 0) {
    shelves.push({
      title: vibe.title,
      strapline: vibe.strapline,
      layout: 'square',
      items: vibeTracks.map((t) => trackToMusicItem(t, t.videoId.startsWith('audius:') ? 'Audius' : 'iTunes')),
      seeAll: null,
    });
  }

  return shelves;
}
