import { StarFilledIcon, StarIcon } from '@/components/icons/Transport';
import { useLocalLibrary } from '@/data/music/localLibrary';
import { useLikeStatus, useSetLiked, useSignedIn } from '@/data/music/queries';
import type { Track } from '@/data/music/types';
import { usePlayer } from '@/state/player';

interface FavoriteButtonProps {
  videoId: string | null;
  track?: Track | null;
  className?: string;
  size?: number;
}

function resolveTrackForId(videoId: string, provided?: Track | null): Track {
  if (provided?.videoId === videoId) return provided;
  const { queue, index, nowPlaying } = usePlayer.getState();
  const inQueue = queue[index]?.track.videoId === videoId ? queue[index]?.track : queue.find((e) => e.track.videoId === videoId)?.track;
  if (inQueue) return inQueue;
  return {
    videoId,
    title: nowPlaying?.title ?? '',
    artists: nowPlaying?.artist ? [{ id: null, name: nowPlaying.artist }] : [],
    album: null,
    durationSec: nowPlaying?.durationSec ?? null,
    explicit: false,
    thumbnail: nowPlaying?.artworkUrl ?? null,
    index: null,
    plays: null,
  };
}

/**
 * Apple's Favorite star: saves to YouTube Music when signed in via the
 * extension, and always saves to the Local Library so iOS PWA & web users can
 * star/save tracks without an account.
 */
export function FavoriteButton({ videoId, track, className, size = 18 }: FavoriteButtonProps) {
  const signedIn = useSignedIn();
  const status = useLikeStatus(signedIn ? videoId : null);
  const setLiked = useSetLiked();
  const localLiked = useLocalLibrary((s) => (videoId ? s.favorites.some((t) => t.videoId === videoId) : false));

  if (!videoId) return null;
  const liked = signedIn ? status.data === 'LIKE' || localLiked : localLiked;

  return (
    <button
      className={className}
      aria-label={liked ? 'Unfavorite' : 'Favorite'}
      aria-pressed={liked}
      disabled={signedIn && status.isPending}
      onClick={(event) => {
        event.stopPropagation();
        useLocalLibrary.getState().toggleFavorite(resolveTrackForId(videoId, track));
        if (signedIn) setLiked.mutate({ videoId, liked: !liked });
      }}
    >
      {liked ? <StarFilledIcon size={size} /> : <StarIcon size={size} />}
    </button>
  );
}
