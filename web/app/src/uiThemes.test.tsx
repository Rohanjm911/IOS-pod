// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StartupScreen } from '@/components/StartupScreen';
import { ThemeModal } from '@/components/ThemeModal';
import { UiRestartDialog } from '@/components/UiRestartDialog';
import { EqualizerModal } from '@/components/EqualizerModal';
import { SleepTimerModal } from '@/components/SleepTimerModal';
import { useEqualizer } from '@/state/equalizer';
import { APP_UI_MODES, useUi, type AppUiMode } from '@/state/ui';

describe('UI themes & components', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    sessionStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('exposes all 6 named UI styles', () => {
    expect(APP_UI_MODES.map((m) => [m.id, m.label])).toEqual([
      ['primary', 'Glassmorphism'],
      ['secondary', 'Neo-Brutalism'],
      ['editorial', 'Editorial Magazine'],
      ['bento', 'Bento Grids'],
      ['retro', 'Retro iPod'],
      ['anime', 'Anime Studio'],
    ]);
  });

  it.each<AppUiMode>(['primary', 'secondary', 'editorial', 'bento', 'retro', 'anime'])(
    'renders StartupScreen cleanly for %s UI mode',
    (mode) => {
      act(() => {
        useUi.setState({ uiMode: mode });
        root.render(<StartupScreen />);
      });
      expect(container.textContent).toContain('ISO pod');
    },
  );

  it('renders ThemeModal and UiRestartDialog and persists UI mode switch', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });

    act(() => {
      useUi.setState({ uiMode: 'primary', pendingUiMode: 'editorial' });
      root.render(
        <>
          <ThemeModal open={true} onClose={() => {}} />
          <UiRestartDialog />
        </>,
      );
    });

    expect(document.body.textContent).toContain('Editorial Magazine');
    expect(document.body.textContent).toContain('Switch App UI');

    act(() => {
      useUi.getState().confirmUiModeSwitchAndRestart();
    });

    expect(localStorage.getItem('isopod:ui-mode')).toBe('editorial');
    expect(document.documentElement.dataset.uiMode).toBe('editorial');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('renders EqualizerModal and updates presets, bands, and bass boost cleanly', () => {
    act(() => {
      root.render(<EqualizerModal open={true} onClose={() => {}} />);
    });
    expect(document.body.textContent).toContain('Sound Equalizer');
    expect(document.body.textContent).toContain('Sub-Bass Booster');

    act(() => {
      useEqualizer.getState().setPreset('bass_boost');
    });
    expect(useEqualizer.getState().preset).toBe('bass_boost');
    expect(useEqualizer.getState().bassBoost).toBe(6);

    act(() => {
      useEqualizer.getState().setBandGain(0, 9.5);
    });
    expect(useEqualizer.getState().gains[0]).toBe(9.5);
    expect(useEqualizer.getState().preset).toBe('custom');

    act(() => {
      useEqualizer.getState().resetEq();
    });
    expect(useEqualizer.getState().preset).toBe('flat');
    expect(useEqualizer.getState().bassBoost).toBe(0);
  });

  it('renders SleepTimerModal cleanly when open', () => {
    act(() => {
      root.render(<SleepTimerModal open={true} onClose={() => {}} />);
    });
    expect(document.body.textContent).toContain('Sleep Timer');
  });
});
