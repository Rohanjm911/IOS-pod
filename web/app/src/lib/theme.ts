import { useSyncExternalStore } from 'react';

export type ThemePresetId = 'crimson' | 'violet' | 'emerald' | 'cyan' | 'amber';
export type ColorSchemeMode = 'system' | 'light' | 'dark';

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  swatchLight: string;
  swatchDark: string;
  surfaceDark: string;
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'crimson',
    name: 'Classic Crimson',
    subtitle: 'Apple Rose & Charcoal',
    swatchLight: '#d60017',
    swatchDark: '#fa586a',
    surfaceDark: '#1f1f1f',
  },
  {
    id: 'violet',
    name: 'Midnight Violet',
    subtitle: 'AMOLED Obsidian & Electric Violet',
    swatchLight: '#7c3aed',
    swatchDark: '#a78bfa',
    surfaceDark: '#09090b',
  },
  {
    id: 'emerald',
    name: 'OLED Emerald',
    subtitle: 'Pure Black & Hi-Fi Mint',
    swatchLight: '#047857',
    swatchDark: '#34d399',
    surfaceDark: '#050807',
  },
  {
    id: 'cyan',
    name: 'Cobalt Cyan',
    subtitle: 'Deep Slate & iOS Sky',
    swatchLight: '#0369a1',
    swatchDark: '#38bdf8',
    surfaceDark: '#0b1120',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    subtitle: 'Studio Charcoal & Gold',
    swatchLight: '#b45309',
    swatchDark: '#fbbf24',
    surfaceDark: '#141110',
  },
];

const SCHEME_KEY = 'color-scheme';
const PRESET_KEY = 'bitchord:theme-preset';
const listeners = new Set<() => void>();

function isValidPreset(value: string | null): value is ThemePresetId {
  return THEME_PRESETS.some((p) => p.id === value);
}

function readScheme(): ColorSchemeMode {
  try {
    const v = localStorage.getItem(SCHEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function readPreset(): ThemePresetId {
  try {
    const v = localStorage.getItem(PRESET_KEY);
    return isValidPreset(v) ? v : 'crimson';
  } catch {
    return 'crimson';
  }
}

let currentScheme: ColorSchemeMode = readScheme();
let currentPreset: ThemePresetId = readPreset();

function applyToDom() {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) {
    meta.content = currentScheme === 'system' ? 'light dark' : currentScheme;
  }
  document.documentElement.dataset.theme = currentPreset;
  const preset = THEME_PRESETS.find((p) => p.id === currentPreset) ?? THEME_PRESETS[0]!;
  const darkMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][media*="dark"]');
  if (darkMeta) darkMeta.content = preset.surfaceDark;
}

function notify() {
  listeners.forEach((l) => l());
}

export function setColorScheme(mode: ColorSchemeMode): void {
  currentScheme = mode;
  try {
    if (mode === 'system') localStorage.removeItem(SCHEME_KEY);
    else localStorage.setItem(SCHEME_KEY, mode);
  } catch {
    // Ignore storage failures in restricted contexts.
  }
  applyToDom();
  notify();
}

export function setThemePreset(preset: ThemePresetId): void {
  currentPreset = preset;
  try {
    localStorage.setItem(PRESET_KEY, preset);
  } catch {
    // Ignore storage failures in restricted contexts.
  }
  applyToDom();
  notify();
}

export function useThemeSettings() {
  const scheme = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentScheme,
  );
  const preset = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentPreset,
  );
  const systemDark = useSyncExternalStore(
    (l) => {
      if (typeof matchMedia === 'undefined') return () => {};
      const mq = matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', l);
      return () => mq.removeEventListener('change', l);
    },
    () => (typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)').matches : false),
    () => false,
  );
  return { scheme, preset, systemDark, setColorScheme, setThemePreset };
}

if (typeof window !== 'undefined') {
  applyToDom();
  window.addEventListener('storage', (e) => {
    if (e.key === SCHEME_KEY || e.key === PRESET_KEY || e.key === null) {
      currentScheme = readScheme();
      currentPreset = readPreset();
      applyToDom();
      notify();
    }
  });
}
