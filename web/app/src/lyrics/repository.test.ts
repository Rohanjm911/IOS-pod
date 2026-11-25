// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { line } from './model';
import { pickBestLrcLibHit } from './providers';
import { lookupLyrics } from './repository';
import { useLyricsSettings } from './settings';

vi.mock('./http', () => ({ lyricsGet: async () => null }));
vi.mock('./providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./providers')>();
  return {
    ...actual,
    lrclib: async () => ({ lines: [line(1000, 'line timed'), line(4000, 'second timed')], ttml: '<tt/>' }),
    lyricsPlus: async () => ({
      lines: [line(1000, 'word', { words: [{ startMs: 1000, endMs: 1500, text: 'word', syllables: [] }] })],
      ttml: '<tt/>',
    }),
    genius: async () => ({ lines: [line(0, 'unsynced line 1'), line(0, 'unsynced line 2')], ttml: null }),
  };
});

describe('lookupLyrics', () => {
  it('asks again when "prefer syllable timing" changes', async () => {
    useLyricsSettings.setState({ order: ['lrclib', 'lyrics-plus'], disabled: [], preferSyllables: false, syncedOnly: true });
    const track = { videoId: 'abcdefghijk', title: 'Song', artist: 'Artist', durationMs: 180_000, album: null };

    expect((await lookupLyrics(track))?.source).toBe('lrclib');
    useLyricsSettings.setState({ preferSyllables: true });
    expect((await lookupLyrics(track))?.source).toBe('lyrics-plus');
  });

  it('rejects untimed/plain lyrics when syncedOnly is enabled', async () => {
    useLyricsSettings.setState({ order: ['genius'], disabled: [], preferSyllables: false, syncedOnly: true });
    const track = { videoId: 'plain123456', title: 'Song', artist: 'Artist', durationMs: 180_000, album: null };

    expect(await lookupLyrics(track)).toBeNull();
    useLyricsSettings.setState({ syncedOnly: false });
    expect((await lookupLyrics(track))?.source).toBe('genius');
  });

  it('rejects LRCLIB wrong-artist, wrong-title, and wrong-duration candidates', () => {
    const query = {
      videoId: 'abc12345678',
      title: 'Forever Young',
      artist: 'Alphaville',
      durationMs: 225_000,
      album: null,
      isrc: null,
    };
    const wrongArtist = {
      trackName: 'Forever Young',
      artistName: 'Different Artist',
      duration: 225,
      syncedLyrics: '[00:10.00] wrong',
    };
    const wrongDuration = {
      trackName: 'Forever Young',
      artistName: 'Alphaville',
      duration: 360,
      syncedLyrics: '[00:10.00] wrong length',
    };
    const exact = {
      trackName: 'Forever Young',
      artistName: 'Alphaville',
      duration: 226,
      syncedLyrics: '[00:10.00] Let us die young',
    };

    expect(pickBestLrcLibHit([wrongArtist, wrongDuration], query)).toBeNull();
    expect(pickBestLrcLibHit([wrongArtist, wrongDuration, exact], query)).toBe('[00:10.00] Let us die young');
  });
});
