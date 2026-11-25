import { create } from 'zustand';
import type { Track } from './types';

export interface LocalPlaylist {
  id: string;
  title: string;
  tracks: Track[];
  createdAt: number;
}

interface SavedLocalLibrary {
  favorites: Track[];
  recentTracks: Track[];
  playlists: LocalPlaylist[];
}

const STORAGE_KEY = 'bitchord:local-library';
const MAX_RECENT = 100;
const MAX_FAVORITES = 500;

function validTrack(item: unknown): item is Track {
  if (!item || typeof item !== 'object') return false;
  const t = item as Partial<Track>;
  return typeof t.videoId === 'string' && t.videoId.length > 0 && typeof t.title === 'string';
}

function readStored(): SavedLocalLibrary {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SavedLocalLibrary>;
    const favorites = Array.isArray(raw.favorites) ? raw.favorites.filter(validTrack) : [];
    const recentTracks = Array.isArray(raw.recentTracks) ? raw.recentTracks.filter(validTrack) : [];
    const playlists = Array.isArray(raw.playlists)
      ? raw.playlists
          .filter(
            (p): p is LocalPlaylist =>
              !!p &&
              typeof p.id === 'string' &&
              typeof p.title === 'string' &&
              Array.isArray(p.tracks),
          )
          .map((p) => ({
            id: p.id,
            title: p.title,
            tracks: p.tracks.filter(validTrack),
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
          }))
      : [];
    return { favorites, recentTracks, playlists };
  } catch {
    return { favorites: [], recentTracks: [], playlists: [] };
  }
}

function writeStored(state: SavedLocalLibrary): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        favorites: state.favorites,
        recentTracks: state.recentTracks,
        playlists: state.playlists,
      }),
    );
  } catch {
    // Ignore quota / restricted context errors cleanly.
  }
}

interface LocalLibraryState extends SavedLocalLibrary {
  toggleFavorite: (track: Track) => boolean;
  isFavorite: (videoId: string) => boolean;
  recordPlayed: (track: Track) => void;
  updateTrackArtwork: (videoId: string, artworkUrl: string) => void;
  createPlaylist: (title: string, initial?: Track | Track[]) => LocalPlaylist | null;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, videoId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  clearRecent: () => void;
}

export const useLocalLibrary = create<LocalLibraryState>()((set, get) => {
  const commit = (partial: Partial<SavedLocalLibrary>) => {
    const current = get();
    const next: SavedLocalLibrary = {
      favorites: partial.favorites ?? current.favorites,
      recentTracks: partial.recentTracks ?? current.recentTracks,
      playlists: partial.playlists ?? current.playlists,
    };
    writeStored(next);
    set(next);
  };

  return {
    ...readStored(),
    toggleFavorite: (track) => {
      const exists = get().favorites.some((t) => t.videoId === track.videoId);
      const favorites = exists
        ? get().favorites.filter((t) => t.videoId !== track.videoId)
        : [track, ...get().favorites].slice(0, MAX_FAVORITES);
      commit({ favorites });
      return !exists;
    },
    isFavorite: (videoId) => get().favorites.some((t) => t.videoId === videoId),
    recordPlayed: (track) => {
      if (!track.videoId || !track.title) return;
      const recentTracks = [track, ...get().recentTracks.filter((t) => t.videoId !== track.videoId)].slice(0, MAX_RECENT);
      commit({ recentTracks });
    },
    updateTrackArtwork: (videoId, artworkUrl) => {
      if (!videoId || !artworkUrl) return;
      const patch = (t: Track) => (t.videoId === videoId ? { ...t, thumbnail: artworkUrl } : t);
      const { favorites, recentTracks, playlists } = get();
      const hasAny =
        favorites.some((t) => t.videoId === videoId) ||
        recentTracks.some((t) => t.videoId === videoId) ||
        playlists.some((p) => p.tracks.some((t) => t.videoId === videoId));
      if (!hasAny) return;
      commit({
        favorites: favorites.map(patch),
        recentTracks: recentTracks.map(patch),
        playlists: playlists.map((p) => ({ ...p, tracks: p.tracks.map(patch) })),
      });
    },
    createPlaylist: (rawTitle, initial) => {
      const title = rawTitle.trim();
      if (!title) return null;
      const tracks = Array.isArray(initial) ? initial : initial ? [initial] : [];
      const created: LocalPlaylist = {
        id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        tracks,
        createdAt: Date.now(),
      };
      commit({ playlists: [created, ...get().playlists] });
      return created;
    },
    addToPlaylist: (playlistId, track) => {
      const playlists = get().playlists.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.tracks.some((t) => t.videoId === track.videoId)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      });
      commit({ playlists });
    },
    removeFromPlaylist: (playlistId, videoId) => {
      const playlists = get().playlists.map((p) =>
        p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.videoId !== videoId) } : p,
      );
      commit({ playlists });
    },
    deletePlaylist: (playlistId) => {
      commit({ playlists: get().playlists.filter((p) => p.id !== playlistId) });
    },
    clearRecent: () => commit({ recentTracks: [] }),
  };
});
