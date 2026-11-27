import { create } from 'zustand';

export type SidePanel = 'up-next' | 'lyrics' | null;

export type VisualizerMode = 'off' | 'bars' | 'wave' | 'particles';

export type PlayerStyle = 'apple' | 'compact' | 'dock' | 'neon';

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
}

const BANNER_KEY = 'isopod:install-banner-dismissed';
const VISUALIZER_KEY = 'isopod:visualizer-mode';
const PLAYER_STYLE_KEY = 'isopod:player-style';
const FULLSCREEN_CONFIG_KEY = 'isopod:fullscreen-config';

const initialVisualizer = (localStorage.getItem(VISUALIZER_KEY) as VisualizerMode) || 'bars';
const savedStyle = localStorage.getItem(PLAYER_STYLE_KEY) as PlayerStyle | null;
const initialPlayerStyle: PlayerStyle =
  savedStyle && PLAYER_STYLES.some((s) => s.id === savedStyle) ? savedStyle : 'apple';

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
}));

// For browser-driven tests, next to __bcPlayer.
if (import.meta.env.DEV) Object.assign(window, { __bcUi: useUi });
