import type { MusicItem, Shelf, Track } from '@/data/music/types';
import {
  fetchAudiusTrendingTracks,
  fetchItunesChartTracks,
  searchAudiusTracks,
  searchItunesTracks,
} from './externalSources';

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

function timeOfDayVibe(): { title: string; strapline: string; query: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      title: 'Morning Acoustic & Fresh',
      strapline: 'MULTI-SOURCE • ITUNES & AUDIUS',
      query: 'acoustic chill morning indie',
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      title: 'Afternoon Energy & Hits',
      strapline: 'MULTI-SOURCE • ITUNES & AUDIUS',
      query: 'bollywood punjabi pop hits',
    };
  }
  return {
    title: 'Late Night Vibes & Lo-Fi',
    strapline: 'MULTI-SOURCE • ITUNES & AUDIUS',
    query: 'late night lofi synthwave chill',
  };
}

/**
 * Builds rich, personalized + multi-source Home recommendation shelves using
 * Audius Discovery Network and Apple iTunes Charts/Search alongside YouTube.
 */
export async function buildMultiSourceHomeShelves(recentTracks: Track[]): Promise<Shelf[]> {
  const excludeIds = new Set(recentTracks.map((t) => t.videoId));
  const seedArtist = recentTracks.find((t) => t.artists[0]?.name)?.artists[0]?.name ?? null;
  const vibe = timeOfDayVibe();

  const [audiusTrending, itunesIndia, itunesGlobal, vibeItunes, vibeAudius, personalItunes, personalAudius] =
    await Promise.all([
      fetchAudiusTrendingTracks(16),
      fetchItunesChartTracks('in', 16),
      fetchItunesChartTracks('us', 16),
      searchItunesTracks(vibe.query, 12),
      searchAudiusTracks(vibe.query, 10),
      seedArtist ? searchItunesTracks(seedArtist, 12) : Promise.resolve([]),
      seedArtist ? searchAudiusTracks(seedArtist, 8) : Promise.resolve([]),
    ]);

  const shelves: Shelf[] = [];

  if (seedArtist) {
    const personal = dedupeTracks([...personalItunes, ...personalAudius], excludeIds, 16);
    if (personal.length > 0) {
      shelves.push({
        title: `Because You Listened to ${seedArtist}`,
        strapline: 'PERSONALIZED MULTI-SOURCE MIX',
        layout: 'tracks',
        items: personal.map((t) => trackToMusicItem(t, t.videoId.startsWith('audius:') ? 'Audius' : 'iTunes')),
        seeAll: null,
      });
    }
  }

  const trending = dedupeTracks(audiusTrending, excludeIds, 16);
  if (trending.length > 0) {
    shelves.push({
      title: 'Trending on Audius',
      strapline: 'DIRECT 320KBPS HI-FI • NO EXTENSION NEEDED',
      layout: 'square',
      items: trending.map((t) => trackToMusicItem(t, 'Audius')),
      seeAll: null,
    });
  }

  const topCharts = dedupeTracks([...itunesIndia.slice(0, 10), ...itunesGlobal.slice(0, 10)], excludeIds, 16);
  if (topCharts.length > 0) {
    shelves.push({
      title: 'Top Charts • India & Global',
      strapline: 'APPLE ITUNES CHARTS',
      layout: 'tracks',
      items: topCharts.map((t) => trackToMusicItem(t, 'iTunes Chart')),
      seeAll: null,
    });
  }

  const vibeTracks = dedupeTracks([...vibeAudius, ...vibeItunes], excludeIds, 16);
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
