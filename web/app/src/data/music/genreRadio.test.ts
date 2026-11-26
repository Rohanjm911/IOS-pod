import { describe, it, expect, vi } from 'vitest';
import type { Track } from './types';

const createTrack = (id: string, title: string, artist: string): Track => ({
  videoId: id,
  title,
  artists: [{ name: artist, id: null }],
  album: null,
  durationSec: 240,
  explicit: false,
  thumbnail: null,
  index: null,
  plays: null,
});

vi.mock('@/data/music/api', () => ({
  fetchRadio: vi.fn().mockRejectedValue(new Error('YTM 403 Forbidden')),
  searchSongs: vi.fn().mockResolvedValue([
    {
      videoId: 'extra1',
      title: 'Kesariya',
      artists: [{ name: 'Arijit Singh', id: null }],
      album: null,
      durationSec: 240,
      explicit: false,
      thumbnail: null,
      index: null,
      plays: null,
    },
    {
      videoId: 'extra2',
      title: 'Raabta',
      artists: [{ name: 'Arijit Singh', id: null }],
      album: null,
      durationSec: 240,
      explicit: false,
      thumbnail: null,
      index: null,
      plays: null,
    },
  ]),
  searchMainVideos: vi.fn().mockResolvedValue([
    {
      videoId: 'extra3',
      title: 'Apna Bana Le',
      artists: [{ name: 'Arijit Singh', id: null }],
      album: null,
      durationSec: 240,
      explicit: false,
      thumbnail: null,
      index: null,
      plays: null,
    },
  ]),
}));

import { detectTrackGenre, fetchSameGenreTracks } from './genreRadio';

describe('genreRadio', () => {
  it('detects Bollywood genre from known artists and keywords', async () => {
    const arijit = createTrack('v1', 'Tum Hi Ho', 'Arijit Singh');
    const genre1 = await detectTrackGenre(arijit);
    expect(genre1).toBe('Bollywood');

    const shreya = createTrack('v2', 'Channa Mereya', 'Pritam, Shreya Ghoshal');
    const genre2 = await detectTrackGenre(shreya);
    expect(genre2).toBe('Bollywood');
  });

  it('detects Punjabi genre from known artists', async () => {
    const track = createTrack('v3', 'Softly', 'Karan Aujla');
    const genre = await detectTrackGenre(track);
    expect(genre).toBe('Punjabi');
  });

  it('detects Dance / EDM genre from known artists', async () => {
    const track = createTrack('v4', 'Save Me', 'Leslie Parrish');
    const genre = await detectTrackGenre(track);
    expect(genre).toBe('Dance / EDM');
  });

  it('detects Rock genre from known artists', async () => {
    const track = createTrack('v5', 'Numb', 'Linkin Park');
    const genre = await detectTrackGenre(track);
    expect(genre).toBe('Rock');
  });

  it('detects Pop genre from known artists', async () => {
    const track = createTrack('v6', 'Anti-Hero', 'Taylor Swift');
    const genre = await detectTrackGenre(track);
    expect(genre).toBe('Pop');
  });

  it('fetches same genre tracks and sets accurate radio source title', async () => {
    const seed = createTrack('seed1', 'Tum Hi Ho', 'Arijit Singh');
    const queue = [seed];

    const result = await fetchSameGenreTracks(seed, queue, 5);
    expect(result.genre).toBe('Bollywood');
    expect(result.sourceTitle).toContain('Bollywood Radio');
    expect(result.tracks.length).toBeGreaterThan(0);
  });
});
