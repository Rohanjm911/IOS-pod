import { create } from 'zustand';
import { usePlayer } from './player';

export type SleepTimerPreset = 'off' | '15' | '30' | '45' | '60' | 'track' | 'custom';

interface SleepTimerState {
  preset: SleepTimerPreset;
  /** End timestamp in milliseconds, or null if off or track-based. */
  endTime: number | null;
  /** Remaining seconds until timer finishes, or null if off or track-based. */
  remainingSec: number | null;
  /** Custom minutes chosen by user. */
  customMinutes: number;
  /** Whether fade-out is enabled during the final 20 seconds. */
  fadeEnabled: boolean;
  /** Saved original volume before fade out started. */
  savedVolume: number | null;

  setTimer: (preset: SleepTimerPreset, customMinutes?: number) => void;
  cancelTimer: () => void;
  setFadeEnabled: (enabled: boolean) => void;
  setCustomMinutes: (minutes: number) => void;
}

let intervalTimer: ReturnType<typeof setInterval> | null = null;
let trackWatchUnsub: (() => void) | null = null;
let initialTrackVideoId: string | null = null;

function clearWatchers() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  if (trackWatchUnsub) {
    trackWatchUnsub();
    trackWatchUnsub = null;
  }
  initialTrackVideoId = null;
}

function stopAndReset() {
  clearWatchers();
  const { savedVolume } = useSleepTimer.getState();
  if (savedVolume !== null) {
    usePlayer.getState().setVolume(savedVolume);
  }
  useSleepTimer.setState({
    preset: 'off',
    endTime: null,
    remainingSec: null,
    savedVolume: null,
  });
  const player = usePlayer.getState();
  if (player.status === 'playing' || player.status === 'buffering') {
    player.togglePlay();
  }
}

export const useSleepTimer = create<SleepTimerState>()((set, get) => ({
  preset: 'off',
  endTime: null,
  remainingSec: null,
  customMinutes: 20,
  fadeEnabled: true,
  savedVolume: null,

  setTimer: (preset, customMin) => {
    clearWatchers();
    const state = get();
    // Restore previous volume if a previous timer was mid-fade
    if (state.savedVolume !== null) {
      usePlayer.getState().setVolume(state.savedVolume);
    }

    if (preset === 'off') {
      set({ preset: 'off', endTime: null, remainingSec: null, savedVolume: null });
      return;
    }

    if (preset === 'track') {
      const currentTrack = usePlayer.getState().nowPlaying;
      initialTrackVideoId = currentTrack?.videoId ?? null;
      set({
        preset: 'track',
        endTime: null,
        remainingSec: null,
        savedVolume: null,
      });

      // Watch for track change or end
      trackWatchUnsub = usePlayer.subscribe((playerState, prev) => {
        const nowVideoId = playerState.nowPlaying?.videoId;
        // If track changed or playback stopped after having a track
        if (initialTrackVideoId && nowVideoId && nowVideoId !== initialTrackVideoId) {
          stopAndReset();
        } else if (!playerState.nowPlaying && prev.nowPlaying) {
          stopAndReset();
        }
      });
      return;
    }

    const minutes =
      preset === 'custom'
        ? Math.max(1, customMin ?? state.customMinutes)
        : parseInt(preset, 10);

    const totalSeconds = minutes * 60;
    const endTime = Date.now() + totalSeconds * 1000;

    set({
      preset,
      endTime,
      remainingSec: totalSeconds,
      customMinutes: preset === 'custom' && customMin ? customMin : state.customMinutes,
      savedVolume: null,
    });

    intervalTimer = setInterval(() => {
      const now = Date.now();
      const currentEnd = get().endTime;
      if (!currentEnd) {
        clearWatchers();
        return;
      }

      const diffSec = Math.max(0, Math.round((currentEnd - now) / 1000));
      const { fadeEnabled, savedVolume } = get();

      if (diffSec <= 0) {
        stopAndReset();
        return;
      }

      // Smooth fade-out in final 20 seconds if enabled
      if (fadeEnabled && diffSec <= 20) {
        const currentVol = usePlayer.getState().volume;
        if (savedVolume === null) {
          set({ savedVolume: currentVol });
        }
        const base = savedVolume ?? currentVol;
        const targetVol = Math.max(0, (diffSec / 20) * base);
        usePlayer.getState().setVolume(targetVol);
      }

      set({ remainingSec: diffSec });
    }, 1000);
  },

  cancelTimer: () => {
    clearWatchers();
    const { savedVolume } = get();
    if (savedVolume !== null) {
      usePlayer.getState().setVolume(savedVolume);
    }
    set({ preset: 'off', endTime: null, remainingSec: null, savedVolume: null });
  },

  setFadeEnabled: (fadeEnabled) => set({ fadeEnabled }),
  setCustomMinutes: (customMinutes) => set({ customMinutes: Math.max(1, customMinutes) }),
}));

export function formatSleepTimerRemaining(remainingSec: number | null, preset: SleepTimerPreset): string {
  if (preset === 'off') return '';
  if (preset === 'track') return 'End of song';
  if (remainingSec === null) return '';
  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
