import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanTrackTitle, isVideoOrMissingArt, resolveAutoAlbumArt } from './albumArt';

describe('albumArt auto-import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects video/missing artwork while leaving googleusercontent square covers untouched', () => {
    expect(isVideoOrMissingArt(null)).toBe(true);
    expect(isVideoOrMissingArt('https://i.ytimg.com/vi/abc123/maxresdefault.jpg')).toBe(true);
    expect(isVideoOrMissingArt('https://lh3.googleusercontent.com/xyz=w544-h544-l90-rj', true)).toBe(true);
    expect(isVideoOrMissingArt('https://lh3.googleusercontent.com/xyz=w544-h544-l90-rj', false)).toBe(false);
  });

  it('cleans music-video suffixes from track titles', () => {
    expect(cleanTrackTitle('Akhiyon Se Goli Maare (Official Video) [4K]')).toBe('Akhiyon Se Goli Maare');
    expect(cleanTrackTitle('Tum Hi Ho (From "Aashiqui 2") | Arijit Singh')).toBe('Tum Hi Ho');
  });

  it('fetches 1000x1000 square cover art from iTunes search and avoids karaoke hits', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              trackName: 'Akhiyon Se Goli Maare (Karaoke Version)',
              artistName: 'Karaoke Studio',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/karaoke/100x100bb.jpg',
            },
            {
              trackName: 'Akhiyon Se Goli Maare',
              artistName: 'Sonu Nigam & Jaspinder Narula',
              collectionName: 'Dulhe Raja',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/12/34/56/100x100bb.jpg',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const cover = await resolveAutoAlbumArt('Akhiyon Se Goli Maare (Official Video)', 'Sonu Nigam, Jaspinder Narula');
    expect(cover).toBe('https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/12/34/56/1000x1000bb.jpg');
  });
});
