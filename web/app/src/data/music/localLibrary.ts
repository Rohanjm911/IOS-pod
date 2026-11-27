import { openDB, type IDBPDatabase } from 'idb';
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

const STORAGE_KEY = 'isopod:local-library';
const LEGACY_STORAGE_KEY = 'bitchord:local-library';
const IDB_NAME = 'isopod-library';
const IDB_STORE = 'library';
const IDB_KEY = 'state';
const MAX_RECENT = 100;
const MAX_FAVORITES = 500;

let idbPromise: Promise<IDBPDatabase> | null = null;
function getDb(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!idbPromise) {
    idbPromise = openDB(IDB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      },
    }).catch(() => {
      idbPromise = null;
      throw new Error('IndexedDB unavailable');
    });
  }
  return idbPromise;
}

function validTrack(item: unknown): item is Track {
  if (!item || typeof item !== 'object') return false;
  const t = item as Partial<Track>;
  return typeof t.videoId === 'string' && t.videoId.length > 0 && typeof t.title === 'string';
}

function normalizeStored(raw: Partial<SavedLocalLibrary> | null | undefined): SavedLocalLibrary {
  if (!raw || typeof raw !== 'object') return { favorites: [], recentTracks: [], playlists: [] };
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
}

function readStored(): SavedLocalLibrary {
  try {
    const rawStr = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawStr) return { favorites: [], recentTracks: [], playlists: [] };
    return normalizeStored(JSON.parse(rawStr) as Partial<SavedLocalLibrary>);
  } catch {
    return { favorites: [], recentTracks: [], playlists: [] };
  }
}

async function writeIdb(state: SavedLocalLibrary): Promise<void> {
  try {
    const dbPromise = getDb();
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.put(IDB_STORE, state, IDB_KEY);
  } catch {
    // Ignore IDB errors in restricted environments.
  }
}

function writeStored(state: SavedLocalLibrary): void {
  const payload: SavedLocalLibrary = {
    favorites: state.favorites,
    recentTracks: state.recentTracks,
    playlists: state.playlists,
  };
  void writeIdb(payload);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // If localStorage hits 5MB quota on large imported playlists, keep IDB full
    // and store a compact backup in localStorage without dropping playlists.
    try {
      const compact: SavedLocalLibrary = {
        favorites: state.favorites.slice(0, 100),
        recentTracks: state.recentTracks.slice(0, 50),
        playlists: state.playlists.map((p) => ({ ...p, tracks: p.tracks.slice(0, 50) })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // IndexedDB still holds the complete unlimited library.
    }
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

// Hydrate full unlimited playlists/favorites from IndexedDB on app startup
if (typeof indexedDB !== 'undefined') {
  const dbPromise = getDb();
  if (dbPromise) {
    void dbPromise
      .then((db) => db.get(IDB_STORE, IDB_KEY))
      .then((stored) => {
        if (!stored) return;
        const idbState = normalizeStored(stored as Partial<SavedLocalLibrary>);
        const current = useLocalLibrary.getState();
        // Merge IDB playlists with any synchronous localStorage state (IDB wins for larger track lists)
        const byId = new Map<string, LocalPlaylist>();
        for (const p of current.playlists) byId.set(p.id, p);
        for (const p of idbState.playlists) {
          const existing = byId.get(p.id);
          if (!existing || p.tracks.length >= existing.tracks.length) {
            byId.set(p.id, p);
          }
        }
        const mergedPlaylists = Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
        const mergedFavorites =
          idbState.favorites.length >= current.favorites.length ? idbState.favorites : current.favorites;
        const mergedRecent =
          idbState.recentTracks.length >= current.recentTracks.length ? idbState.recentTracks : current.recentTracks;

        if (
          mergedPlaylists.length !== current.playlists.length ||
          mergedFavorites.length !== current.favorites.length ||
          mergedRecent.length !== current.recentTracks.length ||
          mergedPlaylists.some((p, i) => p.tracks.length !== current.playlists[i]?.tracks.length)
        ) {
          useLocalLibrary.setState({
            playlists: mergedPlaylists,
            favorites: mergedFavorites,
            recentTracks: mergedRecent,
          });
        }
      })
      .catch(() => {});
  }
}
