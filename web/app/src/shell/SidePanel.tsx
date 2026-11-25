import { X } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useUi } from '@/state/ui';
import { UpNext } from './UpNext';

// am-lyrics is large; it loads the first time the panel opens (prompt §3).
const LyricsPanel = lazy(() => import('./LyricsPanel').then((m) => ({ default: m.LyricsPanel })));

/** Up Next / Lyrics glass panel (report §7). */
export function SidePanel() {
  const panel = useUi((s) => s.sidePanel);
  const closeSidePanel = useUi((s) => s.closeSidePanel);
  // Hidden under the full-screen player, which has its own lyrics: one am-lyrics at a time.
  const fullScreen = useUi((s) => s.fullScreen);
  if (!panel || fullScreen) return null;

  return (
    <aside
      className="absolute inset-y-0 right-0 z-(--z-web-chrome) flex w-(--side-panel-width) animate-slide-in flex-col pt-(--safe-top) pb-(--safe-bottom) glass-material shadow-glass max-md:w-full"
      aria-label={panel === 'up-next' ? 'Up Next' : 'Lyrics'}
    >
      <button
        className="absolute top-[max(10px,var(--safe-top))] right-[max(12px,var(--safe-right))] z-2 hidden size-11 place-items-center rounded-full bg-quinary text-primary max-md:grid"
        aria-label="Close panel"
        onClick={closeSidePanel}
      >
        <X size={18} />
      </button>
      {panel === 'up-next' ? (
        <UpNext />
      ) : (
        <Suspense fallback={null}>
          <LyricsPanel />
        </Suspense>
      )}
    </aside>
  );
}
