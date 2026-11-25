// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import {
  isStrictImportMatch,
  parsePathfinderPlaylistPage,
  parsePlaylistInput,
  parseSpotifyEmbedHtml,
  pickStrictMatch,
} from './playlistImport';

describe('playlistImport', () => {
  it('parses YouTube Music, YouTube, Spotify, and Deezer playlist URLs and IDs', () => {
    expect(parsePlaylistInput('https://music.youtube.com/playlist?list=PL1234567890')).toEqual({
      provider: 'youtube',
      id: 'PL1234567890',
    });
    expect(parsePlaylistInput('https://www.youtube.com/watch?v=abc&list=RDCLAK5uy_ktest123')).toEqual({
      provider: 'youtube',
      id: 'RDCLAK5uy_ktest123',
    });
    expect(parsePlaylistInput('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=xyz')).toEqual({
      provider: 'spotify',
      id: '37i9dQZF1DXcBWIGoYBM5M',
    });
    expect(parsePlaylistInput('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')).toEqual({
      provider: 'spotify',
      id: '37i9dQZF1DXcBWIGoYBM5M',
    });
    expect(parsePlaylistInput('https://www.deezer.com/en/playlist/908622995')).toEqual({
      provider: 'deezer',
      id: '908622995',
    });
    expect(parsePlaylistInput('https://example.com/nope')).toBeNull();
  });

  it('extracts playlist name, cover, accessToken, and tracks from Spotify embed __NEXT_DATA__', () => {
    const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          state: {
            settings: { session: { accessToken: 'tok-123' } },
            data: {
              entity: {
                name: 'Late Night Drive',
                coverArt: { sources: [{ url: 'https://i.scdn.co/image/cover' }] },
                trackList: [
                  { title: 'Midnight City', subtitle: 'M83', duration: 243000, uri: 'spotify:track:t1' },
                  { title: 'Nightcall', subtitle: 'Kavinsky', duration: 258000, uri: 'spotify:track:t2' },
                ],
              },
            },
          },
        },
      },
    })}</script></body></html>`;

    const parsed = parseSpotifyEmbedHtml(html);
    expect(parsed?.title).toBe('Late Night Drive');
    expect(parsed?.coverUrl).toBe('https://i.scdn.co/image/cover');
    expect(parsed?.accessToken).toBe('tok-123');
    expect(parsed?.tracks).toHaveLength(2);
    expect(parsed?.tracks[0]).toEqual({
      id: 't1',
      title: 'Midnight City',
      artist: 'M83',
      album: null,
      durationMs: 243000,
      coverUrl: 'https://i.scdn.co/image/cover',
    });
  });

  it('parses Spotify Pathfinder pages with full album, artist, duration, and totalCount', () => {
    const payload = {
      data: {
        playlistV2: {
          name: 'Mega Playlist',
          images: { items: [{ sources: [{ url: 'https://i.scdn.co/pl.jpg', width: 640 }] }] },
          content: {
            totalCount: 350,
            items: [
              {
                itemV2: {
                  data: {
                    name: 'Blinding Lights',
                    uri: 'spotify:track:abc123',
                    artists: { items: [{ profile: { name: 'The Weeknd' } }] },
                    albumOfTrack: {
                      name: 'After Hours',
                      coverArt: { sources: [{ url: 'https://i.scdn.co/after-hours.jpg', width: 300 }] },
                    },
                    trackDuration: { totalMilliseconds: 200040 },
                  },
                },
              },
            ],
          },
        },
      },
    };
    const parsed = parsePathfinderPlaylistPage(payload);
    expect(parsed.title).toBe('Mega Playlist');
    expect(parsed.totalCount).toBe(350);
    expect(parsed.tracks).toEqual([
      {
        id: 'abc123',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        durationMs: 200040,
        coverUrl: 'https://i.scdn.co/after-hours.jpg',
      },
    ]);
  });

  it('blocks mismatched songs (junk edits, wrong artists, short title collisions)', () => {
    const target = { title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", durationSec: 243 };

    expect(
      isStrictImportMatch(
        { title: 'Midnight City (8D Audio + Bass Boosted)', artist: 'M83', album: null, durationSec: 243 },
        target,
      ),
    ).toBe(false);

    expect(
      isStrictImportMatch(
        { title: 'Midnight City (Slowed + Reverb)', artist: 'M83', album: null, durationSec: 244 },
        target,
      ),
    ).toBe(false);

    expect(
      isStrictImportMatch(
        { title: 'Midnight City', artist: 'Some Cover Band', album: null, durationSec: 243 },
        target,
        { fromVideoShelf: true },
      ),
    ).toBe(false);

    expect(
      isStrictImportMatch(
        { title: 'Time Of Our Lives', artist: 'Pitbull', album: null, durationSec: 229 },
        { title: 'Time', artist: 'Pitbull', durationSec: 229 },
      ),
    ).toBe(false);

    const exact = { title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", durationSec: 243 };
    const remix = { title: 'Midnight City (Eric Prydz Remix)', artist: 'M83', album: null, durationSec: 244 };
    expect(pickStrictMatch([remix, exact], target)).toBe(exact);
  });

  it('imports all continuation pages of a YouTube playlist without hitting a 5-page cap', async () => {
    vi.resetModules();
    const makePage = (pageNum: number, next: (() => Promise<{ data: unknown[]; next: unknown }>) | null) => ({
      data: Array.from({ length: 50 }, (_, idx) => ({
        videoId: `vid-${pageNum}-${idx}`,
        title: `Song ${pageNum}-${idx}`,
        artists: [{ name: 'Artist', id: null }],
        album: null,
        durationSec: 200,
        explicit: false,
        thumbnail: null,
        index: null,
        plays: null,
      })),
      next,
    });

    vi.doMock('./api', async () => {
      const actual = await vi.importActual<typeof import('./api')>('./api');
      const p7 = () => Promise.resolve(makePage(7, null));
      const p6 = () => Promise.resolve(makePage(6, p7));
      const p5 = () => Promise.resolve(makePage(5, p6));
      const p4 = () => Promise.resolve(makePage(4, p5));
      const p3 = () => Promise.resolve(makePage(3, p4));
      const p2 = () => Promise.resolve(makePage(2, p3));
      return {
        ...actual,
        fetchPlaylist: async () => ({
          page: {
            id: 'PLmega123456',
            title: '350 Songs Mega List',
            subtitle: '',
            meta: '',
            description: null,
            thumbnail: null,
            artists: [],
            explicit: false,
            library: null,
            tracks: makePage(1, null).data as never,
          },
          more: p2 as never,
        }),
      };
    });

    const { importExternalPlaylist } = await import('./playlistImport');
    const result = await importExternalPlaylist('https://music.youtube.com/playlist?list=PLmega123456');
    expect(result.title).toBe('350 Songs Mega List');
    expect(result.tracks).toHaveLength(350);
    expect(result.totalSourceTracks).toBe(350);
    vi.doUnmock('./api');
  });
});
