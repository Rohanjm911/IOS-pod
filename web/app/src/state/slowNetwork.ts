import { create } from 'zustand';
import { usePlayer } from './player';

export const NETWORK_JOKES: readonly string[] = [
  'Wi-Fi aaj paidal chal ke gaane la raha hai… thoda chai-pani break le lo ☕📶',
  'Signal itna weak hai ki lagta hai router bhi gym skip kar raha hai 🏋️‍♂️🐢',
  'Gaana buffer ho raha hai ya kabootar parcel se aa raha hai? 🕊️🎵',
  'Internet aaj Monday morning jaisa slow chal raha hai… bas thoda push kar rahe hain 🦥🌐',
  'Network speed dekh ke lagta hai router ne bhi weekend chutti le li hai 🏖️📡',
  'Gaana raste me traffic jam me phansa hai — green signal milte hi bajega 🚦🎧',
  'Buffering… shayad data packets ko auto-rickshaw nahi mila 🛺📶',
  'Aaj net snail-mode me hai — par tension mat le, hum full track laake rahenge 🐌⚡',
  'Router ko ek cup kadak chai pila do, speed thodi thik ho jayegi ☕📡',
  'Ping itna high hai ki gaana space station se ghoom ke aa raha hai 🛸🎶',
  'Internet thoda sust hai aaj — tab tak ek deep breath le lo, track load ho raha hai 🧘‍♂️🌐',
  'Signal bars aaj chhupam-chhupai khel rahe hain… milte hi beat drop hoga 👀🎵',
];

export const OFFLINE_JOKES: readonly string[] = [
  'Internet itna mar gaya hai ki router bhi "RIP" bol raha hai 💀📶',
  'Wi-Fi gayab! Lagta hai padosi ne password change kar diya 🤡🔑',
  'Network pura off hai bhai — ab sirf bathroom singer ban ke gaa lo 🚿🎤',
  'Internet gaya tel lene! Shayad cable chooha chaba gaya 🐀🔌',
  'No Internet! Router ko jaldi CPR do, shayad zinda ho jaye 🚑📡',
  'Data khatam ya Wi-Fi ne breakup kar liya? Zero signal hai bro 💔🌐',
  'Offline ho gaye! Ab hawa me haath hilake Bluetooth dhoondo ✋📡',
  'Net itna dead hai ki dinosaur game bhi bura maan ke chala gaya 🦖💨',
  'Internet bilkul gayab — lagta hai tower pe bijli gir gayi ⚡🗼',
  'Zero network! Router ki aarti utaaro, tabhi gaana chalega 🪔📶',
];

let lastJokeIndex = -1;
let lastOfflineJokeIndex = -1;

/** Picks a random network joke, never repeating the immediately previous one. */
export function pickRandomNetworkJoke(): string {
  if (NETWORK_JOKES.length <= 1) return NETWORK_JOKES[0] ?? 'Network thoda slow hai…';
  let idx = Math.floor(Math.random() * NETWORK_JOKES.length);
  if (idx === lastJokeIndex) {
    idx = (idx + 1) % NETWORK_JOKES.length;
  }
  lastJokeIndex = idx;
  return NETWORK_JOKES[idx]!;
}

/** Picks a random savage offline joke, never repeating the immediately previous one. */
export function pickRandomOfflineJoke(): string {
  if (OFFLINE_JOKES.length <= 1) return OFFLINE_JOKES[0] ?? 'Internet offline hai…';
  let idx = Math.floor(Math.random() * OFFLINE_JOKES.length);
  if (idx === lastOfflineJokeIndex) {
    idx = (idx + 1) % OFFLINE_JOKES.length;
  }
  lastOfflineJokeIndex = idx;
  return OFFLINE_JOKES[idx]!;
}

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, cb: () => void) => void;
  removeEventListener?: (type: string, cb: () => void) => void;
}

export function isConnectionSlow(conn?: NetworkInformationLike | null): boolean {
  if (!conn) return false;
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.45) return true;
  if (typeof conn.rtt === 'number' && conn.rtt > 1400) return true;
  return false;
}

/** Plays a soft, non-intrusive two-tone chime when the slow-network joke popup appears. */
export function playSlowNetworkChime(): void {
  if (typeof window === 'undefined') return;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      void ctx.close().catch(() => {});
      return;
    }
    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, delay: 0, dur: 0.32 }, // E5
      { freq: 987.77, delay: 0.11, dur: 0.48 }, // B5
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.delay);
      gain.gain.setValueAtTime(0.0001, now + n.delay);
      gain.gain.exponentialRampToValueAtTime(0.065, now + n.delay + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.dur + 0.02);
    }
    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 850);
  } catch {
    // Ignore autoplay / audio context restrictions
  }
}

interface SlowNetworkState {
  jokeToast: { message: string; reason: string } | null;
  triggerSlowJoke: (reason: string) => void;
  triggerOfflineJoke: (reason?: string) => void;
  dismissJoke: () => void;
}

const COOLDOWN_MS = 180_000;
const MAX_SESSION_JOKES = 3;
let lastShownAt = 0;
let sessionJokeCount = 0;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useSlowNetwork = create<SlowNetworkState>()((set) => ({
  jokeToast: null,

  triggerSlowJoke(reason) {
    const now = Date.now();
    if (sessionJokeCount >= MAX_SESSION_JOKES || now - lastShownAt < COOLDOWN_MS) return;
    lastShownAt = now;
    sessionJokeCount += 1;
    if (dismissTimer) clearTimeout(dismissTimer);
    playSlowNetworkChime();
    set({
      jokeToast: {
        message: pickRandomNetworkJoke(),
        reason,
      },
    });
    dismissTimer = setTimeout(() => {
      set({ jokeToast: null });
      dismissTimer = null;
    }, 6000);
  },

  triggerOfflineJoke(reason = 'No Internet • Offline') {
    if (dismissTimer) clearTimeout(dismissTimer);
    playSlowNetworkChime();
    set({
      jokeToast: {
        message: pickRandomOfflineJoke(),
        reason,
      },
    });
    dismissTimer = setTimeout(() => {
      set({ jokeToast: null });
      dismissTimer = null;
    }, 6500);
  },

  dismissJoke() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ jokeToast: null });
  },
}));

/** Monitors NetworkInformation + prolonged audio buffering (>= 7.5s) to show a random joke popup only when genuinely slow. */
export function initSlowNetworkMonitor(): () => void {
  if (typeof window === 'undefined') return () => {};

  const nav = navigator as Navigator & { connection?: NetworkInformationLike };
  const conn = nav.connection;

  const checkConn = () => {
    if (isConnectionSlow(conn)) {
      useSlowNetwork.getState().triggerSlowJoke('Very Slow Network');
    }
  };

  const onOffline = () => {
    useSlowNetwork.getState().triggerOfflineJoke('Network Offline • Dead');
  };

  window.addEventListener('offline', onOffline);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setTimeout(onOffline, 1200);
  }

  conn?.addEventListener?.('change', checkConn);
  if (isConnectionSlow(conn)) {
    setTimeout(checkConn, 2500);
  }

  let bufferTimer: ReturnType<typeof setTimeout> | null = null;
  const unsubPlayer = usePlayer.subscribe((state, prev) => {
    if (state.status === 'buffering' && prev.status !== 'buffering') {
      if (bufferTimer) clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => {
        if (usePlayer.getState().status === 'buffering') {
          useSlowNetwork.getState().triggerSlowJoke('Heavy Buffering • Slow Net');
        }
      }, 7500);
    } else if (state.status !== 'buffering' && bufferTimer) {
      clearTimeout(bufferTimer);
      bufferTimer = null;
    }
  });

  return () => {
    window.removeEventListener('offline', onOffline);
    conn?.removeEventListener?.('change', checkConn);
    unsubPlayer();
    if (bufferTimer) clearTimeout(bufferTimer);
  };
}
