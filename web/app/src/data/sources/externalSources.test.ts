import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAudiusStreamUrl,
  isExternalTrackId,
  resolveExternalAudioStream,
  searchExternalTracks,
} from './externalSources';

describe('externalSources', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recognizes external source track IDs and builds Audius stream URLs', () => {
    expect(isExternalTrackId('audius:Wg56v')).toBe(true);
    expect(isExternalTrackId('itunes:1073359419')).toBe(true);
    expect(isExternalTrackId('dQw4w9WgXcQ')).toBe(false);
    expect(buildAudiusStreamUrl('Wg56v')).toBe(
      'https://discoveryprovider.audius.co/v1/tracks/Wg56v/stream?app_name=ISO-pod',
    );
  });

  it('combines and deduplicates Audius and iTunes search results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('discoveryprovider.audius.co')) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  id: 'a1',
                  title: 'Save Me',
                  duration: 215,
                  genre: 'Electronic',
                  user: { name: 'Leslie Parrish' },
                  artwork: { '480x480': 'https://img.audius.co/a1.jpg' },
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            results: [
              {
                trackId: 101,
                trackName: 'Save Me',
                artistName: 'Leslie Parrish',
                collectionName: 'Super Eurobeat',
                trackTimeMillis: 215000,
                artworkUrl100: 'https://img.itunes/100x100bb.jpg',
              },
              {
                trackId: 102,
                trackName: 'Night of Fire',
                artistName: 'Niko',
                collectionName: 'Eurobeat',
                trackTimeMillis: 240000,
                artworkUrl100: 'https://img.itunes/102_100x100bb.jpg',
              },
            ],
          }),
          { status: 200 },
        );
      }),
    );

    const tracks = await searchExternalTracks('Save Me', 10);
    expect(tracks).toHaveLength(2);
    expect(tracks[0]!.videoId).toBe('audius:a1');
    expect(tracks[1]!.videoId).toBe('itunes:102');
    expect(tracks[1]!.thumbnail).toContain('600x600bb');
  });

  it('resolves direct Audius stream without YouTube', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: {
              id: 'Wg56v',
              title: 'Save Me',
              duration: 215,
              user: { name: 'Artist' },
              artwork: { '480x480': 'https://img.audius.co/w.jpg' },
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const stream = await resolveExternalAudioStream('audius:Wg56v');
    expect(stream).not.toBeNull();
    expect(stream!.addonId).toBe('audius');
    expect(stream!.kind).toBe('url');
    expect(stream!.value).toContain('/tracks/Wg56v/stream');
  });
});
