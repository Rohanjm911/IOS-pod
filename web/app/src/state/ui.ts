import { create } from 'zustand';

export type SidePanel = 'up-next' | 'lyrics' | null;

export type VisualizerMode = 'off' | 'bars' | 'wave' | 'particles';

export type PlayerStyle = 'apple' | 'compact' | 'dock' | 'neon';
export type AppUiMode = 'primary' | 'secondary' | 'editorial' | 'bento' | 'retro' | 'anime';
export type BrutalPaletteId =
  | 'acid-ink'
  | 'cyber-cobalt'
  | 'crimson-cream'
  | 'tangerine-espresso'
  | 'mint-obsidian'
  | 'custom';

export interface BrutalPalette {
  id: Exclude<BrutalPaletteId, 'custom'>;
  label: string;
  bg: string;
  ink: string;
  accent: string;
  accent2: string;
  isDark: boolean;
}

export const BRUTAL_PALETTES: readonly BrutalPalette[] = [
  { id: 'acid-ink', label: 'Acid & Ink', bg: '#F5F2EB', ink: '#0B0B0D', accent: '#D9FF00', accent2: '#FF3D00', isDark: false },
  { id: 'cyber-cobalt', label: 'Cobalt & Volt', bg: '#EEF2FF', ink: '#090B1A', accent: '#2952FF', accent2: '#FFE600', isDark: false },
  { id: 'crimson-cream', label: 'Poster Red', bg: '#FFF7ED', ink: '#140B09', accent: '#FF2A3C', accent2: '#00E5A3', isDark: false },
  { id: 'tangerine-espresso', label: 'Tangerine Dark', bg: '#14110F', ink: '#FFF4E6', accent: '#FF6B00', accent2: '#FFE14D', isDark: true },
  { id: 'mint-obsidian', label: 'Mint Obsidian', bg: '#0D1110', ink: '#F2FFF9', accent: '#00F5A0', accent2: '#FF4791', isDark: true },
];

export const APP_UI_MODES: readonly {
  id: AppUiMode;
  label: string;
  description: string;
  schemeName: string;
  swatches: readonly string[];
  accentBg: string;
}[] = [
  {
    id: 'primary',
    label: 'Glassmorphism',
    description: 'Apple Frosted Depth & Blur',
    schemeName: 'Apple Obsidian & Crimson Glass (Fixed)',
    swatches: ['#121218', '#FFFFFF', '#FA243C', '#FF6B81'],
    accentBg: 'linear-gradient(135deg, #FA243C, #D91B38)',
  },
  {
    id: 'secondary',
    label: 'Neo-Brutalism',
    description: 'Bold Ink, Cobalt & Volt',
    schemeName: 'Electric Cobalt, Cream & Volt (Fixed)',
    swatches: ['#F6F4EE', '#0B0B0D', '#2563EB', '#FFE600'],
    accentBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
  },
  {
    id: 'editorial',
    label: 'Editorial Magazine',
    description: 'Print Serif & Asymmetric Grid',
    schemeName: 'Print Ink, Paper & Crimson (Fixed)',
    swatches: ['#FFFFFF', '#000000', '#DC2626', '#6B7280'],
    accentBg: 'linear-gradient(135deg, #DC2626, #991B1B)',
  },
  {
    id: 'bento',
    label: 'Bento Grids',
    description: 'Apple Modular Rounded Tiles',
    schemeName: 'Apple Canvas, Blue & Green (Fixed)',
    swatches: ['#F5F5F7', '#FFFFFF', '#0066CC', '#34C759'],
    accentBg: 'linear-gradient(135deg, #007AFF, #0066CC)',
  },
  {
    id: 'retro',
    label: 'Retro iPod',
    description: 'Brushed Metal & Backlit LCD',
    schemeName: 'Brushed Silver & Aqua LCD (Fixed)',
    swatches: ['#E3E5EA', '#EDF1F5', '#146EF5', '#5BB0FF'],
    accentBg: 'linear-gradient(180deg, #5BB0FF, #146EF5)',
  },
  {
    id: 'anime',
    label: 'Anime Studio',
    description: 'Sakura Neon & Cel-Shaded Manga',
    schemeName: 'Sakura Pink & Cyber Cyan (Fixed)',
    swatches: ['#0D0A1A', '#FF3E8A', '#00D2FF', '#7C3AED'],
    accentBg: 'linear-gradient(135deg, #FF3E8A, #7C3AED)',
  },
];

export type FullScreenArtStyle = 'classic' | 'vinyl' | 'soft' | 'minimal';
export type FullScreenBackdrop = 'mesh' | 'amoled' | 'aurora' | 'blur';
export type FullScreenLayout = 'split' | 'flipped' | 'centered';

export interface FullScreenConfig {
  artStyle: FullScreenArtStyle;
  backdrop: FullScreenBackdrop;
  layout: FullScreenLayout;
  showVisualizer: boolean;
}

export const DEFAULT_FULLSCREEN_CONFIG: FullScreenConfig = {
  artStyle: 'classic',
  backdrop: 'mesh',
  layout: 'split',
  showVisualizer: true,
};

export const PLAYER_STYLES: readonly { id: PlayerStyle; label: string; desc: string }[] = [
  { id: 'apple', label: 'Apple Glass', desc: 'Classic floating pill' },
  { id: 'compact', label: 'Compact Pill', desc: 'Slim minimal bar' },
  { id: 'dock', label: 'Studio Dock', desc: 'Wide bottom deck' },
  { id: 'neon', label: 'Neon Glow', desc: 'Key-color aura border' },
];

interface UiState {
  /** The right-hand glass panel (report §7); one of Up Next or Lyrics at a time. */
  sidePanel: SidePanel;
  toggleSidePanel: (panel: Exclude<SidePanel, null>) => void;
  closeSidePanel: () => void;
  /** The full-screen player: artwork, controls and lyrics over the artwork's mesh (report §7). */
  fullScreen: boolean;
  setFullScreen: (open: boolean) => void;
  /** The sidebar as a drawer, below 484px where it's otherwise hidden. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** The extension install banner, dismissed for this tab only. */
  installBannerDismissed: boolean;
  dismissInstallBanner: () => void;

  /** Sleep Timer modal state. */
  sleepTimerOpen: boolean;
  setSleepTimerOpen: (open: boolean) => void;

  /** Equalizer modal state. */
  equalizerOpen: boolean;
  setEqualizerOpen: (open: boolean) => void;

  /** Theme Customizer modal state. */
  themeModalOpen: boolean;
  setThemeModalOpen: (open: boolean) => void;

  /** Floating Mini-Player state. */
  miniPlayerOpen: boolean;
  setMiniPlayerOpen: (open: boolean) => void;
  toggleMiniPlayer: () => void;

  /** Audio Visualizer mode. */
  visualizerMode: VisualizerMode;
  setVisualizerMode: (mode: VisualizerMode) => void;
  cycleVisualizerMode: () => void;

  /** Floating Player Bar visual style. */
  playerStyle: PlayerStyle;
  setPlayerStyle: (style: PlayerStyle) => void;

  /** Full-Screen Player (Mochy-style) customization config. */
  fullScreenConfig: FullScreenConfig;
  setFullScreenConfig: (patch: Partial<FullScreenConfig>) => void;
  resetFullScreenConfig: () => void;

  /** Full-app UI mode ('primary' | 'secondary') & restart confirmation flow. */
  uiMode: AppUiMode;
  pendingUiMode: AppUiMode | null;
  requestUiModeSwitch: (mode: AppUiMode) => void;
  cancelUiModeSwitch: () => void;
  confirmUiModeSwitchAndRestart: () => void;

  /** Dual-tone Neo-Brutalism palette for Secondary UI. */
  brutalPalette: BrutalPaletteId;
  customBrutalPrimary: string;
  customBrutalSecondary: string;
  setBrutalPalette: (palette: BrutalPaletteId) => void;
  setCustomBrutalColors: (primary: string, secondary: string) => void;
}

const BANNER_KEY = 'isopod:install-banner-dismissed';
const VISUALIZER_KEY = 'isopod:visualizer-mode';
const PLAYER_STYLE_KEY = 'isopod:player-style';
const FULLSCREEN_CONFIG_KEY = 'isopod:fullscreen-config';
const UI_MODE_KEY = 'isopod:ui-mode';
const BRUTAL_PALETTE_KEY = 'isopod:brutal-palette';
const BRUTAL_PRIMARY_KEY = 'isopod:brutal-primary';
const BRUTAL_SECONDARY_KEY = 'isopod:brutal-secondary';

const initialVisualizer = (localStorage.getItem(VISUALIZER_KEY) as VisualizerMode) || 'bars';
const savedStyle = localStorage.getItem(PLAYER_STYLE_KEY) as PlayerStyle | null;
const initialPlayerStyle: PlayerStyle =
  savedStyle && PLAYER_STYLES.some((s) => s.id === savedStyle) ? savedStyle : 'apple';
const savedUiMode = localStorage.getItem(UI_MODE_KEY) as AppUiMode | null;
const initialUiMode: AppUiMode =
  savedUiMode === 'secondary' ||
  savedUiMode === 'editorial' ||
  savedUiMode === 'bento' ||
  savedUiMode === 'retro' ||
  savedUiMode === 'anime'
    ? savedUiMode
    : 'primary';
const savedBrutal = localStorage.getItem(BRUTAL_PALETTE_KEY) as BrutalPaletteId | null;
const initialBrutalPalette: BrutalPaletteId =
  savedBrutal && (savedBrutal === 'custom' || BRUTAL_PALETTES.some((p) => p.id === savedBrutal))
    ? savedBrutal
    : 'acid-ink';
const initialBrutalPrimary = localStorage.getItem(BRUTAL_PRIMARY_KEY) || '#D9FF00';
const initialBrutalSecondary = localStorage.getItem(BRUTAL_SECONDARY_KEY) || '#FF3D00';

function applyBrutalDom(palette: BrutalPaletteId, primary: string, secondary: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.brutalPalette = palette;
  if (palette === 'custom') {
    root.style.setProperty('--brutal-custom-accent', primary);
    root.style.setProperty('--brutal-custom-accent-2', secondary);
  } else {
    root.style.removeProperty('--brutal-custom-accent');
    root.style.removeProperty('--brutal-custom-accent-2');
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.dataset.uiMode = initialUiMode;
  applyBrutalDom(initialBrutalPalette, initialBrutalPrimary, initialBrutalSecondary);
}

function loadFullScreenConfig(): FullScreenConfig {
  try {
    const raw = JSON.parse(localStorage.getItem(FULLSCREEN_CONFIG_KEY) ?? 'null') as Partial<FullScreenConfig> | null;
    return raw ? { ...DEFAULT_FULLSCREEN_CONFIG, ...raw } : DEFAULT_FULLSCREEN_CONFIG;
  } catch {
    return DEFAULT_FULLSCREEN_CONFIG;
  }
}

export const useUi = create<UiState>()((set) => ({
  sidePanel: null,
  toggleSidePanel: (panel) => set((s) => ({ sidePanel: s.sidePanel === panel ? null : panel })),
  closeSidePanel: () => set({ sidePanel: null }),
  fullScreen: false,
  setFullScreen: (fullScreen) => set({ fullScreen }),
  drawerOpen: false,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  installBannerDismissed: sessionStorage.getItem(BANNER_KEY) === '1',
  dismissInstallBanner: () => {
    sessionStorage.setItem(BANNER_KEY, '1');
    set({ installBannerDismissed: true });
  },

  sleepTimerOpen: false,
  setSleepTimerOpen: (sleepTimerOpen) => set({ sleepTimerOpen }),

  equalizerOpen: false,
  setEqualizerOpen: (equalizerOpen) => set({ equalizerOpen }),

  themeModalOpen: false,
  setThemeModalOpen: (themeModalOpen) => set({ themeModalOpen }),

  miniPlayerOpen: false,
  setMiniPlayerOpen: (miniPlayerOpen) => set({ miniPlayerOpen }),
  toggleMiniPlayer: () => set((s) => ({ miniPlayerOpen: !s.miniPlayerOpen })),

  visualizerMode: initialVisualizer,
  setVisualizerMode: (mode) => {
    localStorage.setItem(VISUALIZER_KEY, mode);
    set({ visualizerMode: mode });
  },
  cycleVisualizerMode: () => {
    set((s) => {
      const modes: VisualizerMode[] = ['off', 'bars', 'wave', 'particles'];
      const nextIdx = (modes.indexOf(s.visualizerMode) + 1) % modes.length;
      const nextMode = modes[nextIdx] ?? 'bars';
      localStorage.setItem(VISUALIZER_KEY, nextMode);
      return { visualizerMode: nextMode };
    });
  },

  playerStyle: initialPlayerStyle,
  setPlayerStyle: (playerStyle) => {
    localStorage.setItem(PLAYER_STYLE_KEY, playerStyle);
    set({ playerStyle });
  },

  fullScreenConfig: loadFullScreenConfig(),
  setFullScreenConfig: (patch) =>
    set((s) => {
      const next = { ...s.fullScreenConfig, ...patch };
      localStorage.setItem(FULLSCREEN_CONFIG_KEY, JSON.stringify(next));
      return { fullScreenConfig: next };
    }),
  resetFullScreenConfig: () => {
    localStorage.setItem(FULLSCREEN_CONFIG_KEY, JSON.stringify(DEFAULT_FULLSCREEN_CONFIG));
    set({ fullScreenConfig: DEFAULT_FULLSCREEN_CONFIG });
  },

  uiMode: initialUiMode,
  pendingUiMode: null,
  requestUiModeSwitch: (mode) =>
    set((s) => (s.uiMode === mode ? { pendingUiMode: null } : { pendingUiMode: mode })),
  cancelUiModeSwitch: () => set({ pendingUiMode: null }),
  confirmUiModeSwitchAndRestart: () => {
    const target = useUi.getState().pendingUiMode;
    if (!target) return;
    localStorage.setItem(UI_MODE_KEY, target);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.uiMode = target;
      if (target === 'primary') {
        document.documentElement.style.removeProperty('--brutal-custom-accent');
        document.documentElement.style.removeProperty('--brutal-custom-accent-2');
      }
    }
    set({ uiMode: target, pendingUiMode: null, themeModalOpen: false });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  brutalPalette: initialBrutalPalette,
  customBrutalPrimary: initialBrutalPrimary,
  customBrutalSecondary: initialBrutalSecondary,
  setBrutalPalette: (brutalPalette) => {
    localStorage.setItem(BRUTAL_PALETTE_KEY, brutalPalette);
    set((s) => {
      applyBrutalDom(brutalPalette, s.customBrutalPrimary, s.customBrutalSecondary);
      return { brutalPalette };
    });
  },
  setCustomBrutalColors: (customBrutalPrimary, customBrutalSecondary) => {
    localStorage.setItem(BRUTAL_PALETTE_KEY, 'custom');
    localStorage.setItem(BRUTAL_PRIMARY_KEY, customBrutalPrimary);
    localStorage.setItem(BRUTAL_SECONDARY_KEY, customBrutalSecondary);
    applyBrutalDom('custom', customBrutalPrimary, customBrutalSecondary);
    set({ brutalPalette: 'custom', customBrutalPrimary, customBrutalSecondary });
  },
}));

// For browser-driven tests, next to __bcPlayer.
if (import.meta.env.DEV) Object.assign(window, { __bcUi: useUi });
