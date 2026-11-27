import { endMs, hasKnownEnd, isGap, type LyricLine } from '@/lyrics/model';
import { lookupLyrics } from '@/lyrics/repository';
import { isExternalTrackId } from '@/data/sources/externalSources';

const YOUTUBE_CLIENTS = new Set(['VISIONOS', 'IOS', 'ANDROID', 'YTMUSIC', 'WEB', 'MWEB', 'WEB_REMIX', 'TV']);

/** Auto-skip intro/outro is enabled only for YouTube Music source tracks (not Audius, iTunes, Spotify, local, or addon streams). */
export function isYouTubeMusicSource(videoId: string, client?: string | null): boolean {
  if (!videoId || isExternalTrackId(videoId) || /^[a-z0-9_-]+:/i.test(videoId)) return false;
  if (client && !YOUTUBE_CLIENTS.has(client.toUpperCase())) return false;
  return true;
}

export interface SkipSegment {
  startSec: number;
  endSec: number;
  category: 'music_offtopic' | 'intro' | 'outro';
  source: 'sponsorblock' | 'lyrics';
}

export interface SkipTrackInfo {
  videoId: string;
  title: string;
  artist: string;
  album?: string | null;
  durationSec: number;
}

const SPONSORBLOCK_CATEGORIES = JSON.stringify(['music_offtopic', 'intro', 'outro']);
const MIN_SEGMENT_SEC = 3;
const LONG_INTRO_THRESHOLD_MS = 20_000;
const INTRO_LEAD_IN_MS = 2_500;
const LONG_OUTRO_THRESHOLD_MS = 18_000;
const OUTRO_TAIL_SEC = 3.5;

const segmentCache = new Map<string, SkipSegment[]>();

/** Merge overlapping or adjacent skip segments (within 1.5s). */
export function mergeSegments(segments: SkipSegment[]): SkipSegment[] {
  if (segments.length <= 1) return segments;
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
  const merged: SkipSegment[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i]!;
    const prev = merged[merged.length - 1]!;
    if (curr.startSec <= prev.endSec + 1.5) {
      prev.endSec = Math.max(prev.endSec, curr.endSec);
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}

/**
 * Fetch community-verified non-music intro/outro/credits segments from SponsorBlock.
 * Returns [] cleanly on 404, offline, or timeout.
 */
export async function fetchSponsorBlockSegments(videoId: string): Promise<SkipSegment[]> {
  if (!videoId || typeof fetch !== 'function') return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}&categories=${encodeURIComponent(SPONSORBLOCK_CATEGORIES)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      category?: string;
      actionType?: string;
      segment?: [number, number];
    }>;
    if (!Array.isArray(data)) return [];

    const out: SkipSegment[] = [];
    for (const item of data) {
      if (item.actionType && item.actionType !== 'skip') continue;
      if (!Array.isArray(item.segment) || item.segment.length < 2) continue;
      const startSec = Number(item.segment[0]);
      const endSec = Number(item.segment[1]);
      if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) continue;
      if (startSec < 0 || endSec - startSec < MIN_SEGMENT_SEC) continue;
      const category =
        item.category === 'intro' || item.category === 'outro' ? item.category : 'music_offtopic';
      out.push({ startSec, endSec, category, source: 'sponsorblock' });
    }
    return mergeSegments(out);
  } catch {
    return [];
  }
}

/**
 * Fallback intro/outro detection using synced lyrics vocal boundaries.
 * Skips unusually long visual/dialogue intros (>= 20s before first vocal)
 * and long silent/credits tails (>= 18s after final vocal).
 */
export function detectIntroOutroFromLyrics(
  lines: readonly LyricLine[],
  durationSec: number,
): SkipSegment[] {
  const sung = lines.filter((l) => !isGap(l));
  if (!sung.length) return [];

  const segments: SkipSegment[] = [];
  const first = sung[0]!;
  if (first.timeMs >= LONG_INTRO_THRESHOLD_MS) {
    const endSec = Math.max(0, (first.timeMs - INTRO_LEAD_IN_MS) / 1000);
    if (endSec >= 5 && (durationSec <= 0 || endSec < durationSec * 0.5)) {
      segments.push({ startSec: 0, endSec, category: 'intro', source: 'lyrics' });
    }
  }

  const last = sung[sung.length - 1]!;
  if (durationSec > 0) {
    const lastEndMs = hasKnownEnd(last) ? endMs(last) : last.timeMs + 4000;
    const trailingMs = durationSec * 1000 - lastEndMs;
    if (trailingMs >= LONG_OUTRO_THRESHOLD_MS) {
      const startSec = Math.min(durationSec - 1, lastEndMs / 1000 + OUTRO_TAIL_SEC);
      if (startSec > durationSec * 0.45 && durationSec - startSec >= 5) {
        segments.push({ startSec, endSec: durationSec, category: 'outro', source: 'lyrics' });
      }
    }
  }

  return segments;
}

/**
 * Auto-detect intro, non-music skits, and end credits segments for a track.
 * Tier 1: SponsorBlock (`music_offtopic`, `intro`, `outro`)
 * Tier 2: Synced lyrics vocal boundary analysis
 */
export async function detectSkipSegments(track: SkipTrackInfo): Promise<SkipSegment[]> {
  const cached = segmentCache.get(track.videoId);
  if (cached) return cached;

  const sbSegments = await fetchSponsorBlockSegments(track.videoId);
  if (sbSegments.length > 0) {
    segmentCache.set(track.videoId, sbSegments);
    return sbSegments;
  }

  try {
    const lyrics = await lookupLyrics({
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
      durationMs: Math.round((track.durationSec || 0) * 1000),
      album: track.album ?? null,
    });
    if (lyrics?.synced && lyrics.lines.length > 0) {
      const lyricSegments = detectIntroOutroFromLyrics(lyrics.lines, track.durationSec);
      segmentCache.set(track.videoId, lyricSegments);
      return lyricSegments;
    }
  } catch {
    // Lyrics unavailable; fall back to real-time silence tail detection in player
  }

  segmentCache.set(track.videoId, []);
  return [];
}

/** Find an active unskipped segment at `currentSec`. */
export function findActiveSkipSegment(
  segments: readonly SkipSegment[],
  currentSec: number,
  skippedKeys: ReadonlySet<string>,
): SkipSegment | null {
  for (const seg of segments) {
    const key = `${seg.startSec.toFixed(1)}-${seg.endSec.toFixed(1)}`;
    if (skippedKeys.has(key)) continue;
    if (currentSec >= seg.startSec && currentSec < seg.endSec - 0.5) {
      return seg;
    }
  }
  return null;
}

export function segmentKey(seg: SkipSegment): string {
  return `${seg.startSec.toFixed(1)}-${seg.endSec.toFixed(1)}`;
}
