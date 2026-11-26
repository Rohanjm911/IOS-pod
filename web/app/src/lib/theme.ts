import { useSyncExternalStore } from 'react';

export type ThemePresetId =
  | 'crimson'
  | 'violet'
  | 'emerald'
  | 'cyan'
  | 'amber'
  | 'pink'
  | 'blue'
  | 'orange'
  | 'mint'
  | 'custom';

export type ColorSchemeMode = 'system' | 'light' | 'dark';
export type GlassmorphismLevel = 'default' | 'frosted' | 'subtle' | 'none';

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
    id: 'pink',
    name: 'Neon Magenta',
    subtitle: 'iOS Hot Pink & Cyber Ruby',
    swatchLight: '#e11d48',
    swatchDark: '#fb7185',
    surfaceDark: '#170b10',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    subtitle: 'Apple iOS Royal Blue & Deep Night',
    swatchLight: '#007aff',
    swatchDark: '#60a5fa',
    surfaceDark: '#080d1a',
  },
  {
    id: 'emerald',
    name: 'OLED Emerald',
    subtitle: 'Pure Black & Forest Green',
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
    id: 'orange',
    name: 'Sunset Coral',
    subtitle: 'Warm Tangerine & Ember',
    swatchLight: '#ea580c',
    swatchDark: '#fb923c',
    surfaceDark: '#160e0a',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    subtitle: 'Studio Charcoal & Gold',
    swatchLight: '#b45309',
    swatchDark: '#fbbf24',
    surfaceDark: '#141110',
  },
  {
    id: 'mint',
    name: 'Hi-Fi Mint',
    subtitle: 'Spring Neon & Carbon',
    swatchLight: '#059669',
    swatchDark: '#10b981',
    surfaceDark: '#06120e',
  },
];

const SCHEME_KEY = 'color-scheme';
const PRESET_KEY = 'bitchord:theme-preset';
const AMOLED_KEY = 'bitchord:amoled-black';
const GLASS_KEY = 'bitchord:glassmorphism';
const CUSTOM_ACCENT_KEY = 'bitchord:custom-accent';

const listeners = new Set<() => void>();

function isValidPreset(value: string | null): value is ThemePresetId {
  return value === 'custom' || THEME_PRESETS.some((p) => p.id === value);
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

function readAmoled(): boolean {
  try {
    return localStorage.getItem(AMOLED_KEY) === 'true';
  } catch {
    return false;
  }
}

function readGlass(): GlassmorphismLevel {
  try {
    const v = localStorage.getItem(GLASS_KEY) as GlassmorphismLevel;
    return v === 'frosted' || v === 'subtle' || v === 'none' ? v : 'default';
  } catch {
    return 'default';
  }
}

function readCustomAccent(): string {
  try {
    return localStorage.getItem(CUSTOM_ACCENT_KEY) || '#fa2d48';
  } catch {
    return '#fa2d48';
  }
}

let currentScheme: ColorSchemeMode = readScheme();
let currentPreset: ThemePresetId = readPreset();
let currentAmoled: boolean = readAmoled();
let currentGlass: GlassmorphismLevel = readGlass();
let currentCustomAccent: string = readCustomAccent();

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '250, 45, 72';
}

function applyToDom() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Color Scheme meta
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) {
    meta.content = currentScheme === 'system' ? 'light dark' : currentScheme;
  }

  // 2. Preset & AMOLED & Glass attributes
  root.dataset.theme = currentPreset;
  root.dataset.amoled = currentAmoled ? 'true' : 'false';
  root.dataset.glass = currentGlass;

  // 3. Custom Accent or Dynamic Presets
  if (currentPreset === 'custom') {
    const rgb = hexToRgb(currentCustomAccent);
    root.style.setProperty('--keyColor', currentCustomAccent);
    root.style.setProperty('--keyColor-rgb', rgb);
    root.style.setProperty('--keyColorBG', currentCustomAccent);
    root.style.setProperty('--keyColor-rollover', currentCustomAccent);
    root.style.setProperty('--keyColor-pressed', currentCustomAccent);
    root.style.setProperty('--selectionColor', currentCustomAccent);
  } else {
    // Clear custom style properties so CSS tokens apply cleanly
    root.style.removeProperty('--keyColor');
    root.style.removeProperty('--keyColor-rgb');
    root.style.removeProperty('--keyColorBG');
    root.style.removeProperty('--keyColor-rollover');
    root.style.removeProperty('--keyColor-pressed');
    root.style.removeProperty('--selectionColor');
  }

  // 4. Update meta theme-color for PWA & mobile address bar
  const preset = THEME_PRESETS.find((p) => p.id === currentPreset) ?? THEME_PRESETS[0]!;
  const darkMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][media*="dark"]');
  if (darkMeta) {
    darkMeta.content = currentAmoled ? '#000000' : preset.surfaceDark;
  }
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
    // Ignore storage failures
  }
  applyToDom();
  notify();
}

export function setThemePreset(preset: ThemePresetId): void {
  currentPreset = preset;
  try {
    localStorage.setItem(PRESET_KEY, preset);
  } catch {
    // Ignore storage failures
  }
  applyToDom();
  notify();
}

export function setAmoledBlack(enabled: boolean): void {
  currentAmoled = enabled;
  try {
    localStorage.setItem(AMOLED_KEY, String(enabled));
  } catch {
    // Ignore storage failures
  }
  applyToDom();
  notify();
}

export function setGlassmorphism(level: GlassmorphismLevel): void {
  currentGlass = level;
  try {
    localStorage.setItem(GLASS_KEY, level);
  } catch {
    // Ignore storage failures
  }
  applyToDom();
  notify();
}

export function setCustomAccent(hex: string): void {
  currentCustomAccent = hex;
  currentPreset = 'custom';
  try {
    localStorage.setItem(CUSTOM_ACCENT_KEY, hex);
    localStorage.setItem(PRESET_KEY, 'custom');
  } catch {
    // Ignore storage failures
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
  const amoled = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentAmoled,
  );
  const glass = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentGlass,
  );
  const customAccent = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentCustomAccent,
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

  return {
    scheme,
    preset,
    amoled,
    glass,
    customAccent,
    systemDark,
    setColorScheme,
    setThemePreset,
    setAmoledBlack,
    setGlassmorphism,
    setCustomAccent,
  };
}

if (typeof window !== 'undefined') {
  applyToDom();
  window.addEventListener('storage', (e) => {
    if (
      e.key === SCHEME_KEY ||
      e.key === PRESET_KEY ||
      e.key === AMOLED_KEY ||
      e.key === GLASS_KEY ||
      e.key === CUSTOM_ACCENT_KEY ||
      e.key === null
    ) {
      currentScheme = readScheme();
      currentPreset = readPreset();
      currentAmoled = readAmoled();
      currentGlass = readGlass();
      currentCustomAccent = readCustomAccent();
      applyToDom();
      notify();
    }
  });
}
