// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

describe('playback session persistence', () => {
  it('restores last played song, queue, index, and resume position on reload', async () => {
    vi.resetModules();
    localStorage.setItem(
      'isopod:playback-session',
      JSON.stringify({
        index: 0,
        positionSec: 74,
        nowPlaying: {
          videoId: 'vid123',
          title: 'Retained Song',
          artist: 'Sonu Nigam',
          artworkUrl: 'https://example.com/art.jpg',
          durationSec: 240,
          streamInfo: 'opus via direct',
          stream: null,
        },
        queue: [
          {
            entryId: 'e1',
            tier: 'user',
            source: { title: 'Search', type: 'search' },
            track: {
              videoId: 'vid123',
              title: 'Retained Song',
              artists: [{ id: 'a1', name: 'Sonu Nigam' }],
              album: null,
              durationSec: 240,
              explicit: false,
              thumbnail: 'https://example.com/art.jpg',
              index: null,
              plays: null,
            },
          },
        ],
      }),
    );

    const { getPlayhead, getResumePositionSec, usePlayer } = await import('./player');
    const state = usePlayer.getState();
    expect(state.nowPlaying?.videoId).toBe('vid123');
    expect(state.nowPlaying?.title).toBe('Retained Song');
    expect(state.index).toBe(0);
    expect(state.queue).toHaveLength(1);
    expect(state.status).toBe('paused');
    expect(getResumePositionSec('vid123')).toBe(74);
    expect(getPlayhead()).toEqual({ sec: 74, paused: true });
  }, 15_000);
});
