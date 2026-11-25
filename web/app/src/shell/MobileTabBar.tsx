import { Settings } from 'lucide-react';
import { PrefetchNavLink } from '@/components/PrefetchLink';
import { AllPlaylistsIcon, HomeIcon, NewIcon, SearchIcon } from '@/components/icons/NavIcons';

const tabClass =
  'group flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 py-1 text-secondary transition-colors aria-[current=page]:bg-quinary aria-[current=page]:text-key [@media(orientation:landscape)_and_(max-height:540px)]:min-h-10 [@media(orientation:landscape)_and_(max-height:540px)]:flex-row [@media(orientation:landscape)_and_(max-height:540px)]:gap-1.5 [@media(orientation:landscape)_and_(max-height:540px)]:py-0.5';

/**
 * Native iOS-style bottom navigation bar (< 768px: iPhone & iPad Split View),
 * seated safely above the Home Indicator and below the floating mini-player.
 */
export function MobileTabBar() {
  return (
    <nav
      className="hidden max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-[calc(var(--z-web-chrome)-2)] max-md:flex max-md:h-[calc(var(--mobile-tab-bar-height)+var(--safe-bottom))] max-md:items-start max-md:gap-1 max-md:border-t-[0.5px] max-md:border-t-divider max-md:px-2 max-md:pt-1 max-md:pb-(--safe-bottom) max-md:glass-material"
      style={{
        paddingLeft: 'max(8px, var(--safe-left))',
        paddingRight: 'max(8px, var(--safe-right))',
      }}
      aria-label="Mobile navigation"
    >
      <PrefetchNavLink to="/home" className={tabClass}>
        <HomeIcon size={22} className="shrink-0" />
        <span className="type-[500_10px/12px] group-aria-[current=page]:font-bold">Home</span>
      </PrefetchNavLink>
      <PrefetchNavLink to="/search" className={tabClass}>
        <SearchIcon size={22} className="shrink-0" />
        <span className="type-[500_10px/12px] group-aria-[current=page]:font-bold">Search</span>
      </PrefetchNavLink>
      <PrefetchNavLink to="/new" className={tabClass}>
        <NewIcon size={22} className="shrink-0" />
        <span className="type-[500_10px/12px] group-aria-[current=page]:font-bold">New</span>
      </PrefetchNavLink>
      <PrefetchNavLink to="/library" className={tabClass}>
        <AllPlaylistsIcon size={22} className="shrink-0" />
        <span className="type-[500_10px/12px] group-aria-[current=page]:font-bold">Library</span>
      </PrefetchNavLink>
      <PrefetchNavLink to="/settings" className={tabClass}>
        <Settings size={20} strokeWidth={2} className="shrink-0 my-px" aria-hidden="true" />
        <span className="type-[500_10px/12px] group-aria-[current=page]:font-bold">Settings</span>
      </PrefetchNavLink>
    </nav>
  );
}
