import { ChevronLeft, ChevronRight, ListEnd, ListPlus, ListStart, MoreHorizontal, Plus, Star } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Menu, MenuHeader, MenuItem, MenuSeparator, type MenuPlacement } from '@/components/Menu';
import { useLocalLibrary } from '@/data/music/localLibrary';
import {
  useAddToPlaylist,
  useLikeStatus,
  usePlaylistOptions,
  useSetLiked,
  useSignedIn,
} from '@/data/music/queries';
import type { Track } from '@/data/music/types';
import { usePlayer } from '@/state/player';

function PlaylistChoices({ track, onDone, onBack }: { track: Track; onDone: () => void; onBack: () => void }) {
  const signedIn = useSignedIn();
  const options = usePlaylistOptions(track.videoId, signedIn);
  const add = useAddToPlaylist();
  const localPlaylists = useLocalLibrary((s) => s.playlists);
  const { addToPlaylist, createPlaylist } = useLocalLibrary.getState();

  return (
    <>
      <MenuItem icon={<ChevronLeft size={14} />} onSelect={onBack}>
        Back
      </MenuItem>
      <MenuSeparator />
      <MenuHeader>Local Playlists</MenuHeader>
      <MenuItem
        icon={<Plus size={14} />}
        onSelect={() => {
          const name = window.prompt('Playlist name');
          if (name?.trim()) createPlaylist(name, track);
          onDone();
        }}
      >
        New Playlist…
      </MenuItem>
      {localPlaylists.map((pl) => (
        <MenuItem
          key={pl.id}
          onSelect={() => {
            addToPlaylist(pl.id, track);
            onDone();
          }}
        >
          {pl.title}
        </MenuItem>
      ))}
      {signedIn && (
        <>
          <MenuSeparator />
          <MenuHeader>YouTube Music</MenuHeader>
          {options.isPending && (
            <MenuItem disabled onSelect={() => {}}>
              Loading…
            </MenuItem>
          )}
          {options.isError && (
            <MenuItem disabled onSelect={() => {}}>
              Couldn’t load YouTube playlists
            </MenuItem>
          )}
          {options.data?.map((option) => (
            <MenuItem
              key={option.playlistId}
              onSelect={() => {
                add.mutate({ playlistId: option.playlistId, videoId: track.videoId });
                onDone();
              }}
            >
              {option.title}
            </MenuItem>
          ))}
        </>
      )}
    </>
  );
}

/** Favorite and Add to Playlist: works locally everywhere and syncs with YouTube Music when signed in. */
function AccountItems({ track, onClose, onPlaylists }: { track: Track; onClose: () => void; onPlaylists: () => void }) {
  const signedIn = useSignedIn();
  const status = useLikeStatus(signedIn ? track.videoId : null);
  const setLiked = useSetLiked();
  const localLiked = useLocalLibrary((s) => s.favorites.some((t) => t.videoId === track.videoId));
  const liked = signedIn ? status.data === 'LIKE' || localLiked : localLiked;
  return (
    <>
      <MenuSeparator />
      <MenuItem
        icon={<Star size={15} fill={liked ? 'currentColor' : 'none'} />}
        disabled={signedIn && status.isPending}
        onSelect={() => {
          useLocalLibrary.getState().toggleFavorite(track);
          if (signedIn) setLiked.mutate({ videoId: track.videoId, liked: !liked });
          onClose();
        }}
      >
        {liked ? 'Unfavorite' : 'Favorite'}
      </MenuItem>
      <MenuItem icon={<ListPlus size={15} />} trailing={<ChevronRight size={14} />} onSelect={onPlaylists}>
        Add to Playlist
      </MenuItem>
    </>
  );
}

function TrackMenuItems({ track, onClose }: { track: Track; onClose: () => void }) {
  const [view, setView] = useState<'main' | 'playlists'>('main');
  if (view === 'playlists') {
    return <PlaylistChoices track={track} onDone={onClose} onBack={() => setView('main')} />;
  }
  const { playNext, addToQueue } = usePlayer.getState();
  return (
    <>
      <MenuItem icon={<ListStart size={15} />} onSelect={() => (onClose(), playNext([track]))}>
        Play Next
      </MenuItem>
      <MenuItem icon={<ListEnd size={15} />} onSelect={() => (onClose(), addToQueue([track]))}>
        Add to Queue
      </MenuItem>
      <AccountItems track={track} onClose={onClose} onPlaylists={() => setView('playlists')} />
    </>
  );
}

/**
 * The ⋯ button at the end of a track row (report §14): Play Next and Add to
 * Queue for everyone; Favorite and Add to Playlist signed in.
 */
export function TrackMenu({
  track,
  className,
  placement,
  onOpenChange,
}: {
  track: Track;
  className?: string;
  /** Where the menu opens from the button; the player's sit at the bottom of the window. */
  placement?: MenuPlacement;
  /** Told when the menu opens and closes; most mounts don't need to know. */
  onOpenChange?: (open: boolean) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = useCallback(() => setAnchor(null), []);
  useEffect(() => {
    onOpenChange?.(anchor !== null);
  }, [anchor, onOpenChange]);
  return (
    <>
      <button
        className={className}
        aria-label={`More options for ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        data-open={anchor !== null || undefined}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(anchor ? null : event.currentTarget);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>
      {anchor && (
        <Menu anchor={anchor} placement={placement} onClose={close} label={track.title}>
          <TrackMenuItems track={track} onClose={close} />
        </Menu>
      )}
    </>
  );
}
