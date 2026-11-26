import { create } from 'zustand';

export type Gains10 = [number, number, number, number, number, number, number, number, number, number];

export interface CustomEqPreset {
  id: string;
  name: string;
  gains: Gains10;
  bassBoost: number;
}

export interface EqPresetConfig {
  id: string;
  name: string;
  gains: Gains10;
  bassBoost: number;
  isCustom?: boolean;
}

export const FREQ_VALUES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const FREQ_LABELS = ['32 Hz', '64 Hz', '125 Hz', '250 Hz', '500 Hz', '1 kHz', '2 kHz', '4 kHz', '8 kHz', '16 kHz'];
export const SHORT_FREQ_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

export const POPULAR_PRESETS: EqPresetConfig[] = [
  {
    id: 'flat',
    name: 'Flat',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
  },
  {
    id: 'bass_boost',
    name: 'Bass Boost',
    gains: [8, 7, 5, 2, 0, 0, 0, 0, 1, 2],
    bassBoost: 6,
  },
  {
    id: 'bass_reducer',
    name: 'Bass Reducer',
    gains: [-6, -5, -3, -1, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
  },
  {
    id: 'vocal_booster',
    name: 'Vocal Booster',
    gains: [-2, -1, 0, 1, 3, 4, 3, 2, 1, 0],
    bassBoost: 0,
  },
  {
    id: 'treble_booster',
    name: 'Treble Booster',
    gains: [-1, 0, 0, 0, 0, 1, 2, 4, 6, 8],
    bassBoost: 0,
  },
  {
    id: 'electronic',
    name: 'Electronic / EDM',
    gains: [6, 5, 3, 0, -1, 1, 2, 4, 5, 6],
    bassBoost: 4,
  },
  {
    id: 'rock',
    name: 'Rock / Metal',
    gains: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5],
    bassBoost: 3,
  },
  {
    id: 'hip_hop',
    name: 'Hip-Hop / Trap',
    gains: [8, 7, 5, 2, 0, 1, 2, 1, 3, 4],
    bassBoost: 6,
  },
  {
    id: 'pop',
    name: 'Pop',
    gains: [2, 3, 4, 2, 1, 2, 3, 4, 3, 2],
    bassBoost: 2,
  },
  {
    id: 'acoustic',
    name: 'Acoustic / Folk',
    gains: [3, 3, 2, 1, 1, 2, 2, 3, 3, 3],
    bassBoost: 0,
  },
  {
    id: 'classical',
    name: 'Classical',
    gains: [4, 3, 2, 1, 0, 0, 0, 2, 3, 4],
    bassBoost: 0,
  },
  {
    id: 'jazz',
    name: 'Jazz / Blues',
    gains: [3, 3, 2, 1, 1, 1, 0, 1, 2, 3],
    bassBoost: 1,
  },
  {
    id: 'deep_lounge',
    name: 'Deep Lounge',
    gains: [7, 6, 4, 1, -1, 0, 1, 2, 4, 5],
    bassBoost: 5,
  },
  {
    id: 'spoken',
    name: 'Dialogue / Spoken',
    gains: [-8, -6, -3, 0, 2, 4, 4, 3, 1, -1],
    bassBoost: 0,
  },
];

export const EQ_PRESETS = POPULAR_PRESETS;
export type EqPreset = string;

const STORAGE_KEY = 'bitchord:equalizer-config-v2';
const CUSTOM_PRESETS_KEY = 'bitchord:custom-eq-presets';

interface SavedEqConfig {
  enabled: boolean;
  preset: string;
  gains: Gains10;
  bassBoost: number;
  bassBoostEnabled: boolean;
}

interface EqualizerStore {
  enabled: boolean;
  preset: string;
  gains: Gains10;
  bassBoost: number; // 0 - 12 dB
  bassBoostEnabled: boolean;
  customPresets: CustomEqPreset[];

  setEnabled: (enabled: boolean) => void;
  setPreset: (presetId: string) => void;
  setBandGain: (index: number, gain: number) => void;
  setAllGains: (gains: Gains10) => void;
  setBassBoost: (boost: number) => void;
  setBassBoostEnabled: (enabled: boolean) => void;
  resetEq: () => void;

  saveCustomPreset: (name: string) => CustomEqPreset;
  deleteCustomPreset: (id: string) => void;
  importCustomPreset: (data: string | object) => { success: boolean; message: string; preset?: CustomEqPreset };
  exportPreset: (presetId?: string) => string;
}

function loadSaved(): SavedEqConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.gains) && parsed.gains.length === 10) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    enabled: true,
    preset: 'flat',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    bassBoostEnabled: false,
  };
}

function loadCustomPresets(): CustomEqPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function save(config: SavedEqConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

function saveCustomPresetsToDisk(presets: CustomEqPreset[]) {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

// Web Audio chain references
let audioCtx: AudioContext | null = null;
let currentCtx: AudioContext | null = null;
let eqMasterGain: GainNode | null = null;
let deckGains: GainNode[] = [];
let eqFilters: BiquadFilterNode[] = [];
let bassFilter: BiquadFilterNode | null = null;
let activeAnalyserNode: AnalyserNode | null = null;
const mediaSources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass({ latencyHint: 'playback' });
  }
  return audioCtx;
}

export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
    void ctx.resume();
  }
}

export function getOrCreateMediaElementSource(
  ctx: AudioContext,
  audio: HTMLAudioElement,
): MediaElementAudioSourceNode {
  let source = mediaSources.get(audio);
  if (!source) {
    source = ctx.createMediaElementSource(audio);
    mediaSources.set(audio, source);
  }
  return source;
}

export function getActiveAnalyser(): AnalyserNode | null {
  return activeAnalyserNode;
}

export function ensureEqualizerGraph(ctx: AudioContext): {
  input: AudioNode;
  output: AudioNode;
  analyser: AnalyserNode;
} {
  currentCtx = ctx;

  if (eqFilters.length === 0) {
    const types: BiquadFilterType[] = [
      'lowshelf',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'highshelf',
    ];

    eqFilters = FREQ_VALUES.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = types[i]!;
      filter.frequency.setValueAtTime(freq, ctx.currentTime);
      const q = types[i] === 'peaking' ? 1.414 : 0.707;
      filter.Q.setValueAtTime(q, ctx.currentTime);
      filter.gain.setValueAtTime(0, ctx.currentTime);
      return filter;
    });

    bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.setValueAtTime(80, ctx.currentTime);
    bassFilter.gain.setValueAtTime(0, ctx.currentTime);

    // Chain: eq0 -> eq1 -> ... -> eq9 -> bassFilter
    for (let i = 0; i < eqFilters.length - 1; i++) {
      eqFilters[i]!.connect(eqFilters[i + 1]!);
    }
    eqFilters[eqFilters.length - 1]!.connect(bassFilter);

    // Analyser node connected after bassFilter and into ctx.destination
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    activeAnalyserNode = analyser;

    bassFilter.connect(analyser);
    analyser.connect(ctx.destination);
  }

  return {
    input: eqFilters[0]!,
    output: bassFilter!,
    analyser: activeAnalyserNode!,
  };
}

export function connectAudioElementToEqualizer(
  audio: HTMLAudioElement,
  deckIndex: number,
): GainNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const { input } = ensureEqualizerGraph(ctx);

  if (!eqMasterGain) {
    eqMasterGain = new GainNode(ctx, { gain: 1 });
    eqMasterGain.connect(input);
  }

  let source: MediaElementAudioSourceNode | null = null;
  try {
    source = getOrCreateMediaElementSource(ctx, audio);
  } catch (err) {
    console.warn('BitChord Equalizer: MediaElementSource init warning:', err);
    return null;
  }

  let deckGain = deckGains[deckIndex];
  if (!deckGain) {
    deckGain = new GainNode(ctx, { gain: 1 });
    deckGains[deckIndex] = deckGain;
    deckGain.connect(eqMasterGain);
  }

  try {
    source.connect(deckGain);
  } catch {
    // already connected
  }

  const { enabled, gains, bassBoost, bassBoostEnabled } = useEqualizer.getState();
  applyWebAudioSettings(enabled, gains, bassBoost, bassBoostEnabled);

  return deckGain;
}

export function applyEqualizerVolumes(level: number, faderGains: number[]): boolean {
  const ctx = getAudioContext();
  if (!ctx || !eqMasterGain) return false;
  const now = ctx.currentTime;
  eqMasterGain.gain.setTargetAtTime(level, now, 0.015);
  faderGains.forEach((fader, i) => {
    const deckGain = deckGains[i];
    if (deckGain) {
      deckGain.gain.setTargetAtTime(fader, now, 0.015);
    }
  });
  return true;
}

function applyWebAudioSettings(
  enabled: boolean,
  gains: Gains10,
  bassBoost: number,
  bassBoostEnabled: boolean,
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (eqFilters.length === 0) {
    ensureEqualizerGraph(ctx);
  }

  resumeAudioContext();
  const now = ctx.currentTime;

  eqFilters.forEach((filter, idx) => {
    const targetGain = enabled ? (gains[idx] ?? 0) : 0;
    try {
      filter.gain.setTargetAtTime(targetGain, now, 0.02);
    } catch {
      filter.gain.setValueAtTime(targetGain, now);
    }
  });

  if (bassFilter) {
    const targetBass = enabled && bassBoostEnabled ? bassBoost : 0;
    try {
      bassFilter.gain.setTargetAtTime(targetBass, now, 0.02);
    } catch {
      bassFilter.gain.setValueAtTime(targetBass, now);
    }
  }
}

export function attachEqualizerToContext(
  ctx: AudioContext,
  sourceNode: AudioNode,
  destinationNode?: AudioNode,
): { inputNode: AudioNode; outputNode: AudioNode } {
  const { input, output, analyser } = ensureEqualizerGraph(ctx);
  try {
    sourceNode.connect(input);
  } catch {
    // already connected
  }

  if (destinationNode && destinationNode !== analyser) {
    try {
      analyser.connect(destinationNode);
    } catch {
      // already connected
    }
  }

  const { enabled, gains, bassBoost, bassBoostEnabled } = useEqualizer.getState();
  applyWebAudioSettings(enabled, gains, bassBoost, bassBoostEnabled);

  return { inputNode: input, outputNode: output };
}

if (typeof window !== 'undefined') {
  (window as unknown as { __bcEqualizer?: object }).__bcEqualizer = {
    get ctx() {
      return currentCtx;
    },
    get state() {
      return currentCtx?.state;
    },
    get filters() {
      return eqFilters;
    },
    get bassFilter() {
      return bassFilter;
    },
    get master() {
      return eqMasterGain;
    },
    get analyser() {
      return activeAnalyserNode;
    },
    resume: resumeAudioContext,
  };
}

const initial = loadSaved();
const initialCustom = loadCustomPresets();

export const useEqualizer = create<EqualizerStore>()((set, get) => ({
  enabled: initial.enabled,
  preset: initial.preset,
  gains: initial.gains,
  bassBoost: initial.bassBoost,
  bassBoostEnabled: initial.bassBoostEnabled,
  customPresets: initialCustom,

  setEnabled: (enabled) => {
    set({ enabled });
    const { gains, bassBoost, bassBoostEnabled, preset } = get();
    save({ enabled, preset, gains, bassBoost, bassBoostEnabled });
    applyWebAudioSettings(enabled, gains, bassBoost, bassBoostEnabled);
  },

  setPreset: (presetId) => {
    const popular = POPULAR_PRESETS.find((x) => x.id === presetId);
    const custom = get().customPresets.find((x) => x.id === presetId);
    const p = popular || custom;

    if (!p) {
      if (presetId === 'custom') {
        set({ preset: 'custom' });
      }
      return;
    }

    const nextGains = [...p.gains] as Gains10;
    const nextBass = p.bassBoost;
    const nextBassEnabled = p.bassBoost > 0;

    set({
      preset: presetId,
      gains: nextGains,
      bassBoost: nextBass,
      bassBoostEnabled: nextBassEnabled,
    });

    const { enabled } = get();
    save({ enabled, preset: presetId, gains: nextGains, bassBoost: nextBass, bassBoostEnabled: nextBassEnabled });
    applyWebAudioSettings(enabled, nextGains, nextBass, nextBassEnabled);
  },

  setBandGain: (index, gain) => {
    const clamped = Math.max(-12, Math.min(12, Math.round(gain * 2) / 2));
    const nextGains = [...get().gains] as Gains10;
    nextGains[index] = clamped;

    set({ gains: nextGains, preset: 'custom' });
    const { enabled, bassBoost, bassBoostEnabled } = get();
    save({ enabled, preset: 'custom', gains: nextGains, bassBoost, bassBoostEnabled });
    applyWebAudioSettings(enabled, nextGains, bassBoost, bassBoostEnabled);
  },

  setAllGains: (gains) => {
    const clamped = gains.map((g) => Math.max(-12, Math.min(12, Math.round(g * 2) / 2))) as Gains10;
    set({ gains: clamped, preset: 'custom' });
    const { enabled, bassBoost, bassBoostEnabled } = get();
    save({ enabled, preset: 'custom', gains: clamped, bassBoost, bassBoostEnabled });
    applyWebAudioSettings(enabled, clamped, bassBoost, bassBoostEnabled);
  },

  setBassBoost: (boost) => {
    const clamped = Math.max(0, Math.min(12, Math.round(boost)));
    set({ bassBoost: clamped, bassBoostEnabled: clamped > 0, preset: 'custom' });
    const { enabled, gains } = get();
    save({ enabled, preset: 'custom', gains, bassBoost: clamped, bassBoostEnabled: clamped > 0 });
    applyWebAudioSettings(enabled, gains, clamped, clamped > 0);
  },

  setBassBoostEnabled: (bassBoostEnabled) => {
    set({ bassBoostEnabled, preset: 'custom' });
    const { enabled, gains, bassBoost } = get();
    save({ enabled, preset: 'custom', gains, bassBoost, bassBoostEnabled });
    applyWebAudioSettings(enabled, gains, bassBoost, bassBoostEnabled);
  },

  resetEq: () => {
    get().setPreset('flat');
  },

  saveCustomPreset: (name) => {
    const cleanName = name.trim() || `Custom EQ ${get().customPresets.length + 1}`;
    const newPreset: CustomEqPreset = {
      id: `custom_${Date.now()}`,
      name: cleanName,
      gains: [...get().gains] as Gains10,
      bassBoost: get().bassBoostEnabled ? get().bassBoost : 0,
    };
    const nextCustom = [...get().customPresets, newPreset];
    set({ customPresets: nextCustom, preset: newPreset.id });
    saveCustomPresetsToDisk(nextCustom);
    const { enabled, gains, bassBoost, bassBoostEnabled } = get();
    save({ enabled, preset: newPreset.id, gains, bassBoost, bassBoostEnabled });
    return newPreset;
  },

  deleteCustomPreset: (id) => {
    const nextCustom = get().customPresets.filter((p) => p.id !== id);
    set({ customPresets: nextCustom, preset: get().preset === id ? 'flat' : get().preset });
    saveCustomPresetsToDisk(nextCustom);
    if (get().preset === id) {
      get().setPreset('flat');
    }
  },

  importCustomPreset: (data) => {
    try {
      let parsed: any = data;
      if (typeof data === 'string') {
        parsed = JSON.parse(data.trim());
      }
      if (!parsed) return { success: false, message: 'Invalid or empty preset data' };

      let gains: number[] = [];
      let name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Imported EQ';
      let bassBoost = typeof parsed.bassBoost === 'number' ? Math.max(0, Math.min(12, parsed.bassBoost)) : 0;

      if (Array.isArray(parsed.gains)) {
        gains = parsed.gains;
      } else if (Array.isArray(parsed)) {
        gains = parsed;
      }

      if (gains.length < 5) {
        return { success: false, message: 'Preset must contain at least 5 to 10 frequency band values' };
      }

      // If imported preset has 5 bands, interpolate to 10 bands
      let normalizedGains: Gains10;
      if (gains.length === 5) {
        normalizedGains = [
          gains[0]!,
          gains[0]!,
          gains[1]!,
          gains[1]!,
          gains[2]!,
          gains[2]!,
          gains[3]!,
          gains[3]!,
          gains[4]!,
          gains[4]!,
        ];
      } else {
        // Take first 10, pad with 0 if needed
        normalizedGains = [
          gains[0] ?? 0,
          gains[1] ?? 0,
          gains[2] ?? 0,
          gains[3] ?? 0,
          gains[4] ?? 0,
          gains[5] ?? 0,
          gains[6] ?? 0,
          gains[7] ?? 0,
          gains[8] ?? 0,
          gains[9] ?? 0,
        ].map((g) => Math.max(-12, Math.min(12, Math.round(Number(g) * 2) / 2))) as Gains10;
      }

      const newPreset: CustomEqPreset = {
        id: `custom_${Date.now()}`,
        name,
        gains: normalizedGains,
        bassBoost,
      };

      const nextCustom = [...get().customPresets, newPreset];
      set({
        customPresets: nextCustom,
        preset: newPreset.id,
        gains: normalizedGains,
        bassBoost,
        bassBoostEnabled: bassBoost > 0,
      });

      saveCustomPresetsToDisk(nextCustom);
      const { enabled } = get();
      save({ enabled, preset: newPreset.id, gains: normalizedGains, bassBoost, bassBoostEnabled: bassBoost > 0 });
      applyWebAudioSettings(enabled, normalizedGains, bassBoost, bassBoost > 0);

      return { success: true, message: `Successfully imported "${name}"!`, preset: newPreset };
    } catch (e: any) {
      return { success: false, message: `Failed to parse JSON: ${e.message || String(e)}` };
    }
  },

  exportPreset: (presetId) => {
    const targetId = presetId || get().preset;
    const popular = POPULAR_PRESETS.find((x) => x.id === targetId);
    const custom = get().customPresets.find((x) => x.id === targetId);
    const p = popular || custom;

    const exportData = {
      name: p ? p.name : 'Custom EQ',
      frequencies: FREQ_VALUES,
      gains: p ? p.gains : get().gains,
      bassBoost: p ? p.bassBoost : (get().bassBoostEnabled ? get().bassBoost : 0),
      version: '10-band-v2',
    };

    return JSON.stringify(exportData, null, 2);
  },
}));
