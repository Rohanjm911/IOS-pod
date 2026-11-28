// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  computeTasteProfile,
  inferGenreSync,
  recordFavoriteSignal,
  recordPlaySignal,
  recordTrackOutcome,
  scoreCandidate,
} from './tasteProfile';
import type { Track } from './types';

const mk = (id: string, title: string, artist: string, durationSec = 220): Track => ({
  videoId: id,
  title,
  artists: [{ id: null, name: artist }],
  album: null,
  durationSec,
  explicit: false,
  thumbnail: 'https://example.com/art.jpg',
  index: null,
  plays: null,
});

describe('tasteProfile precision recommendation engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recognizes dominant genre and artist from plays, completions, and favorites', () => {
    const t1 = mk('b1', 'Tum Hi Ho', 'Arijit Singh');
    const t2 = mk('b2', 'Kesariya', 'Arijit Singh');
    const t3 = mk('p1', 'Softly', 'Karan Aujla');

    recordPlaySignal(t1);
    recordTrackOutcome(t1, 0.98, true);
    recordFavoriteSignal(t2, true);
    recordPlaySignal(t3);
    // Early skip on Punjabi track reduces its weight
    recordTrackOutcome(t3, 0.12, false);

    const profile = computeTasteProfile({
      recentTracks: [t1, t2, t3],
      favorites: [t2],
    });

    expect(profile.topGenres[0]?.genre).toBe('Bollywood');
    expect(profile.topArtists[0]?.artist).toBe('arijit singh');
  });

  it('suppresses repeatedly early-skipped tracks and prioritizes genre-matched full tracks', () => {
    const seed = mk('s1', 'Channa Mereya', 'Arijit Singh');
    const goodMatch = mk('g1', 'Apna Bana Le', 'Arijit Singh', 240);
    const otherGenre = mk('o1', 'Numb', 'Linkin Park', 210);
    const shortClip = mk('sh1', 'Tum Hi Ho (Short)', 'Arijit Singh', 28);
    const skipped = mk('sk1', 'Bad Match', 'Unknown Artist', 200);

    recordPlaySignal(seed);
    recordTrackOutcome(seed, 1.0, true);
    recordTrackOutcome(skipped, 0.1, false);
    recordTrackOutcome(skipped, 0.08, false);

    const profile = computeTasteProfile({ recentTracks: [seed] });
    const seedGenre = inferGenreSync(seed);

    const goodScore = scoreCandidate(goodMatch, profile, { seedTrack: seed, seedGenre });
    const otherScore = scoreCandidate(otherGenre, profile, { seedTrack: seed, seedGenre });
    const shortScore = scoreCandidate(shortClip, profile, { seedTrack: seed, seedGenre });
    const skippedScore = scoreCandidate(skipped, profile, { seedTrack: seed, seedGenre });

    expect(goodScore).toBeGreaterThan(otherScore);
    expect(goodScore).toBeGreaterThan(shortScore);
    expect(skippedScore).toBeLessThan(-50);
  });

  it('adapts recommendations to time-of-day streaming habits and session momentum', () => {
    const lateNight = new Date('2026-11-28T23:30:00');
    const morning = new Date('2026-11-28T08:30:00');

    const lofi = mk('lf1', 'Midnight Study Beats', 'Lofi Girl');
    const rock = mk('rk1', 'Numb', 'Linkin Park');

    // User streams Lo-Fi at late night and Rock in the morning
    recordPlaySignal(lofi, null, lateNight);
    recordTrackOutcome(lofi, 0.95, true, null, lateNight);
    recordPlaySignal(rock, null, morning);
    recordTrackOutcome(rock, 0.92, true, null, morning);

    const nightProfile = computeTasteProfile({ recentTracks: [lofi, rock], atDate: lateNight });
    const morningProfile = computeTasteProfile({ recentTracks: [lofi, rock], atDate: morning });

    expect(nightProfile.activeSlot).toBe('late_night');
    expect(nightProfile.slotGenres[0]?.genre).toBe('Lo-Fi');
    expect(morningProfile.activeSlot).toBe('morning');
    expect(morningProfile.slotGenres[0]?.genre).toBe('Rock');

    // At late night, a fresh Lo-Fi track scores higher than Rock due to learned time-of-day habit
    const freshLofi = mk('lf2', 'Chillhop Rain', 'Lofi Girl');
    const freshRock = mk('rk2', 'In The End', 'Linkin Park');
    expect(scoreCandidate(freshLofi, nightProfile)).toBeGreaterThan(scoreCandidate(freshRock, nightProfile));
  });
});
