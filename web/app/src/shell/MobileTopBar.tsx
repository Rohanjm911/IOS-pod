import { Menu } from 'lucide-react';
import { PrefetchLink } from '@/components/PrefetchLink';
import { LogoMark } from '@/components/icons/LogoMark';
import { useUi } from '@/state/ui';

/** Below 768px (iPhone & iPad Split View), the sidebar folds into this top bar and a drawer. */
export function MobileTopBar() {
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  return (
    <header
      className="hidden max-md:absolute max-md:inset-x-0 max-md:top-0 max-md:z-[calc(var(--z-web-chrome)-2)] max-md:grid max-md:h-[calc(var(--mobile-top-bar-height)+var(--safe-top))] max-md:grid-cols-[44px_1fr_44px] max-md:items-center max-md:pt-(--safe-top) max-md:glass-material"
      style={{
        paddingLeft: 'max(14px, var(--safe-left))',
        paddingRight: 'max(14px, var(--safe-right))',
      }}
    >
      <button
        className="grid size-11 place-items-center rounded-full"
        aria-label="Open menu"
        aria-expanded={drawerOpen}
        aria-controls="main-nav-drawer"
        onClick={() => setDrawerOpen(true)}
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      <PrefetchLink to="/home" className="inline-flex items-center gap-1.5 justify-self-center type-[700_16px/20px]" aria-label="ISO pod, Home">
        <LogoMark size={20} className="text-primary" />
        <span>ISO pod</span>
      </PrefetchLink>
      <span className="w-11" />
    </header>
  );
}
