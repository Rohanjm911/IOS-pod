import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { PrefetchLink } from '@/components/PrefetchLink';
import { StartupScreen } from '@/components/StartupScreen';
import { useExtension } from '@/extension/useExtension';
import { useProxyChecking, useProxyUrl } from '@/lib/iosProxy';
import { isIosDevice, isPhoneBrowser } from '@/lib/platform';
import { resumeSession } from '@/party/listenTogether';
import { startPartySync } from '@/party/partySync';
import { useDiscordPresence } from '@/playback/discordPresence';
import { startHistoryReporting } from '@/playback/historyReporting';
import { startLivePresence } from '@/playback/livePresence';
import { useUi } from '@/state/ui';
import { Banner, bannerButtonClass } from './Banner';
import { MiniPlayer } from './MiniPlayer';
import { MobilePlayerBar } from './MobilePlayerBar';
import { MobileTabBar } from './MobileTabBar';
import { MobileTopBar } from './MobileTopBar';
import { PlayerBar } from './PlayerBar';
import { SidePanel } from './SidePanel';
import { Sidebar } from './Sidebar';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const ios = isIosDevice();
const phone = isPhoneBrowser();

// It carries am-lyrics; loaded the first time it opens, as the side panel's lyrics are.
const FullScreenPlayer = lazy(() => import('./FullScreenPlayer').then((m) => ({ default: m.FullScreenPlayer })));
const EqualizerModal = lazy(() => import('@/components/EqualizerModal').then((m) => ({ default: m.EqualizerModal })));
const SleepTimerModal = lazy(() => import('@/components/SleepTimerModal').then((m) => ({ default: m.SleepTimerModal })));
const ThemeModal = lazy(() => import('@/components/ThemeModal').then((m) => ({ default: m.ThemeModal })));
const UiRestartDialog = lazy(() => import('@/components/UiRestartDialog').then((m) => ({ default: m.UiRestartDialog })));

/**
 * The app frame (report §1): glass sidebar, the scrolling page, the floating
 * player pill (or iPhone mini-player), the side panel, and the bottom band when there is one.
 */
export function AppShell() {
  useKeyboardShortcuts();
  useDiscordPresence();
  // Listen Together: pick a party back up after a reload, and keep the player in step with it.
  useEffect(() => {
    resumeSession();
    return startPartySync();
  }, []);
  // Plays into the account's YouTube Music history (Settings › Share Listening Activity).
  useEffect(() => startHistoryReporting(), []);
  // Counts this tab in the "listening now" figure beside the phone and PC apps.
  useEffect(() => startLivePresence(), []);
  const extension = useExtension();
  const proxyUrl = useProxyUrl();
  const proxyChecking = useProxyChecking();
  const bannerDismissed = useUi((s) => s.installBannerDismissed);
  const dismissBanner = useUi((s) => s.dismissInstallBanner);
  const fullScreen = useUi((s) => s.fullScreen);
  const sleepTimerOpen = useUi((s) => s.sleepTimerOpen);
  const setSleepTimerOpen = useUi((s) => s.setSleepTimerOpen);
  const equalizerOpen = useUi((s) => s.equalizerOpen);
  const setEqualizerOpen = useUi((s) => s.setEqualizerOpen);
  const themeModalOpen = useUi((s) => s.themeModalOpen);
  const setThemeModalOpen = useUi((s) => s.setThemeModalOpen);
  const pendingUiMode = useUi((s) => s.pendingUiMode);

  let banner = null;
  if (ios || phone) {
    if (!proxyUrl && !proxyChecking && !bannerDismissed) {
      banner = (
        <Banner
          title={ios ? 'Connect YouTube streaming for iOS.' : 'Connect YouTube streaming for mobile.'}
          detail="Mobile browsers can’t run desktop extensions. Add your self-hosted iOS/CORS proxy URL in Settings."
          action={
            <PrefetchLink className={bannerButtonClass} to="/settings">
              Set Up Proxy
            </PrefetchLink>
          }
          onDismiss={dismissBanner}
        />
      );
    }
  } else if (extension.state === 'missing' && !proxyUrl && !proxyChecking && !bannerDismissed) {
    banner = (
      <Banner
        title="Play YouTube Music with the ISO pod extension."
        detail="Playback, YouTube Music sign-in, Spotify and Discord need the extension. Addons and lyrics work without it."
        action={
          <PrefetchLink className={bannerButtonClass} to="/extension">
            Get the Extension
          </PrefetchLink>
        }
        onDismiss={dismissBanner}
      />
    );
  }

  return (
    <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto]">
      {/* The side panel slides in from beyond the right edge; never let it scroll the page. */}
      <div className="relative min-h-0 overflow-hidden">
        <Sidebar />
        <MobileTopBar />
        {/* The page scrolls under the fixed sidebar and the floating player. */}
        <main
          id="scrollable-page"
          className="absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-y-contain pl-[calc(var(--web-navigation-width)+var(--safe-left))] pr-(--safe-right) data-tint:bg-(--page-tint) data-tint:transition-[background-color] data-tint:duration-300 data-tint:ease-in max-md:pt-[calc(var(--mobile-top-bar-height)+var(--safe-top))] max-md:pl-(--safe-left)"
        >
          {/* Clears the floating pill / mobile mini-player + bottom tab bar and iOS home indicator. */}
          <div className="min-h-full pb-[calc(var(--player-pill-height)+var(--player-bottom-offset)+var(--safe-bottom)+40px)] max-md:pb-[calc(var(--mobile-tab-bar-height)+var(--mini-player-height)+var(--safe-bottom)+32px)]">
            <Outlet />
          </div>
        </main>
        <PlayerBar />
        <MobilePlayerBar />
        <MobileTabBar />
        <SidePanel />
        <MiniPlayer />
      </div>
      {banner}
      {sleepTimerOpen && (
        <Suspense fallback={null}>
          <SleepTimerModal open={sleepTimerOpen} onClose={() => setSleepTimerOpen(false)} />
        </Suspense>
      )}
      {equalizerOpen && (
        <Suspense fallback={null}>
          <EqualizerModal open={equalizerOpen} onClose={() => setEqualizerOpen(false)} />
        </Suspense>
      )}
      {themeModalOpen && (
        <Suspense fallback={null}>
          <ThemeModal open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
        </Suspense>
      )}
      {pendingUiMode && (
        <Suspense fallback={null}>
          <UiRestartDialog />
        </Suspense>
      )}
      <StartupScreen />
      {fullScreen && (
        <Suspense fallback={null}>
          <FullScreenPlayer />
        </Suspense>
      )}
    </div>
  );
}
