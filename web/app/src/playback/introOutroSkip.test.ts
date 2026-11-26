import { describe, expect, it } from 'vitest';
import {
  detectIntroOutroFromLyrics,
  findActiveSkipSegment,
  mergeSegments,
  segmentKey,
  type SkipSegment,
} from './introOutroSkip';
import type { LyricLine } from '@/lyrics/model';

const line = (timeMs: number, endMs: number, text: string): LyricLine => ({
  timeMs,
  words: [{ startMs: timeMs, endMs, text, syllables: [] }],
  text,
  sungUntilMs: endMs,
  background: null,
  alignment: 'start',
});

describe('introOutroSkip', () => {
  it('merges overlapping or adjacent skip segments', () => {
    const merged = mergeSegments([
      { startSec: 0, endSec: 18, category: 'intro', source: 'sponsorblock' },
      { startSec: 18.8, endSec: 32, category: 'music_offtopic', source: 'sponsorblock' },
      { startSec: 210, endSec: 240, category: 'outro', source: 'sponsorblock' },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0]!.startSec).toBe(0);
    expect(merged[0]!.endSec).toBe(32);
    expect(merged[1]!.startSec).toBe(210);
  });

  it('detects long intro and long outro credits from synced lyrics', () => {
    const lines: LyricLine[] = [
      line(28_000, 32_000, 'First sung line'),
      line(90_000, 95_000, 'Chorus line'),
      line(175_000, 180_000, 'Final sung line'),
    ];
    // 220s total duration -> 28s intro and 40s trailing credits
    const segments = detectIntroOutroFromLyrics(lines, 220);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ category: 'intro', source: 'lyrics', startSec: 0 });
    expect(segments[0]!.endSec).toBeCloseTo(25.5, 1);
    expect(segments[1]).toMatchObject({ category: 'outro', source: 'lyrics', endSec: 220 });
    expect(segments[1]!.startSec).toBeCloseTo(183.5, 1);
  });

  it('ignores normal short musical intros and outros', () => {
    const lines: LyricLine[] = [
      line(8_000, 12_000, 'Starts quickly'),
      line(170_000, 175_000, 'Ends near track end'),
    ];
    const segments = detectIntroOutroFromLyrics(lines, 182);
    expect(segments).toHaveLength(0);
  });

  it('matches active segment once and respects skippedKeys', () => {
    const segments: SkipSegment[] = [
      { startSec: 0, endSec: 25, category: 'intro', source: 'sponsorblock' },
    ];
    const skipped = new Set<string>();
    const active = findActiveSkipSegment(segments, 1.2, skipped);
    expect(active).not.toBeNull();
    skipped.add(segmentKey(active!));
    expect(findActiveSkipSegment(segments, 5, skipped)).toBeNull();
  });
});
