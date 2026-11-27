// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalLibrary } from './localLibrary';
import type { Track } from './types';

function makeTrack(id: string, title: string): Track {
  return {
    videoId: id,
    title,
    artists: [{ id: 'a1', name: 'Artist' }],
    album: null,
    durationSec: 210,
    explicit: false,
    thumbnail: 'https://example.com/art.jpg',
    index: null,
    plays: null,
  };
}

describe('localLibrary', () => {
  beforeEach(() => {
    localStorage.removeItem('isopod:local-library');
    useLocalLibrary.setState({ favorites: [], recentTracks: [], playlists: [] });
  });

  it('toggles favorite tracks and persists them', () => {
    const t = makeTrack('v1', 'Track One');
    const lib = useLocalLibrary.getState();
    expect(lib.toggleFavorite(t)).toBe(true);
    expect(useLocalLibrary.getState().isFavorite('v1')).toBe(true);
    expect(useLocalLibrary.getState().favorites).toHaveLength(1);

    expect(useLocalLibrary.getState().toggleFavorite(t)).toBe(false);
    expect(useLocalLibrary.getState().isFavorite('v1')).toBe(false);
  });

  it('records played tracks newest-first without duplicates', () => {
    const lib = useLocalLibrary.getState();
    lib.recordPlayed(makeTrack('v1', 'First'));
    lib.recordPlayed(makeTrack('v2', 'Second'));
    lib.recordPlayed(makeTrack('v1', 'First'));

    const recent = useLocalLibrary.getState().recentTracks;
    expect(recent.map((t) => t.videoId)).toEqual(['v1', 'v2']);
  });

  it('creates custom playlists and manages tracks cleanly', () => {
    const lib = useLocalLibrary.getState();
    const pl = lib.createPlaylist('Road Trip', makeTrack('v1', 'Song 1'))!;
    expect(pl.title).toBe('Road Trip');
    lib.addToPlaylist(pl.id, makeTrack('v2', 'Song 2'));
    lib.addToPlaylist(pl.id, makeTrack('v1', 'Song 1')); // deduped

    const stored = useLocalLibrary.getState().playlists[0]!;
    expect(stored.tracks.map((t) => t.videoId)).toEqual(['v1', 'v2']);

    lib.removeFromPlaylist(pl.id, 'v1');
    expect(useLocalLibrary.getState().playlists[0]!.tracks.map((t) => t.videoId)).toEqual(['v2']);

    lib.deletePlaylist(pl.id);
    expect(useLocalLibrary.getState().playlists).toHaveLength(0);
  });
});
