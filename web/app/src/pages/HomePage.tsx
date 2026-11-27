import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Shelves, TrackShelf } from '@/components/music/ShelfView';
import { LoadError, LoadMoreError } from '@/components/music/States';
import { useHome, useLibrary, useYouTubeReady } from '@/data/music/queries';
import { useLocalLibrary } from '@/data/music/localLibrary';
import type { Shelf, Track } from '@/data/music/types';
import { buildMultiSourceHomeShelves } from '@/data/sources/homeRecommendations';
import { HomeSkeleton } from '@/skeletons/PageSkeletons';
import { ShelfSkeleton } from '@/skeletons/ShelfSkeleton';

const RECENT_TITLE = 'Recently Played';
const RECENT_LIMIT = 20;
const RECENT_SOURCE = { title: RECENT_TITLE, type: 'home' as const };

/**
 * The account's listening history, newest first, one row per song
 * (YtMusicRepository.recentlyPlayed): the first 20, signed in only. The same
 * query as Library's Recently Played, so either page warms the other.
 */
function useRecentlyPlayed(): Track[] {
  const history = useLibrary('recent');
  const localRecent = useLocalLibrary((s) => s.recentTracks);
  const remote = history.data?.pages[0]?.data.tracks ?? [];
  const merged = [...localRecent, ...remote];
  const seen = new Set<string>();
  return merged.filter((t) => !seen.has(t.videoId) && seen.add(t.videoId)).slice(0, RECENT_LIMIT);
}

/** Multi-source Home feed: personalized history + Audius + iTunes + YouTube Music shelves. */
export default function HomePage() {
  const { missing } = useYouTubeReady();
  const home = useHome();
  const recent = useRecentlyPlayed();
  const sentinel = useRef<HTMLDivElement>(null);

  const recentSeed = recent[0]?.videoId ?? 'none';
  const multiSource = useQuery({
    queryKey: ['home', 'multi-source', recentSeed],
    queryFn: () => buildMultiSourceHomeShelves(recent),
    staleTime: 5 * 60_000,
  });

  // Loads the next shelves before the bottom comes into view; after a failed
  // page it waits for Try Again rather than retrying on every scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !home.hasNextPage || home.isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !home.isFetchingNextPage) void home.fetchNextPage();
      },
      { root: document.getElementById('scrollable-page'), rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [home.hasNextPage, home.isFetchingNextPage, home.isFetchNextPageError, home.fetchNextPage]);

  const externalShelves = multiSource.data ?? [];

  // Even without the YouTube extension, render multi-source Audius & iTunes recommendations.
  if (missing) {
    if (multiSource.isLoading && externalShelves.length === 0) return <HomeSkeleton />;
    return (
      <>
        <PageHeader title="Home" />
        {recent.length > 0 && <TrackShelf title={RECENT_TITLE} to="/library/recent" tracks={recent} source={RECENT_SOURCE} />}
        <Shelves shelves={externalShelves} />
      </>
    );
  }

  // Only a failed first page replaces the feed if external shelves also failed to load.
  if (home.isError && !home.data && externalShelves.length === 0) {
    return (
      <>
        <PageHeader title="Home" />
        <LoadError error={home.error} onRetry={() => void home.refetch()} />
      </>
    );
  }
  if (!home.data && externalShelves.length === 0) return <HomeSkeleton />;

  // YouTube's feed can carry its own, older Recently Played; the history wins, as on the phone.
  const ytShelves = (home.data?.pages ?? [])
    .flatMap((page) => page.data)
    .filter((shelf) => !(recent.length > 0 && shelf.title.trim().toLowerCase() === RECENT_TITLE.toLowerCase()));

  // Interleave multi-source Audius/iTunes recommendations with YouTube Music shelves for variety.
  const mergedShelves: Shelf[] = [];
  if (externalShelves[0]) mergedShelves.push(externalShelves[0]);
  if (ytShelves.length > 0) {
    mergedShelves.push(ytShelves[0]!);
    mergedShelves.push(...externalShelves.slice(1));
    mergedShelves.push(...ytShelves.slice(1));
  } else {
    mergedShelves.push(...externalShelves.slice(1));
  }

  return (
    <>
      <PageHeader title="Home" />
      {recent.length > 0 && <TrackShelf title={RECENT_TITLE} to="/library/recent" tracks={recent} source={RECENT_SOURCE} />}
      <Shelves shelves={mergedShelves} />
      <div ref={sentinel} />
      {home.isFetchingNextPage && <ShelfSkeleton kind="square" />}
      {home.isFetchNextPageError && <LoadMoreError onRetry={() => void home.fetchNextPage()} />}
    </>
  );
}
