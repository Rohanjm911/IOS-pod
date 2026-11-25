import { ListMusic, Settings, Smartphone, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MdOutlineExtension } from 'react-icons/md';
import { PrefetchLink, PrefetchNavLink } from '@/components/PrefetchLink';
import { LogoMark } from '@/components/icons/LogoMark';
import {
  AlbumsIcon,
  AllPlaylistsIcon,
  ArtistsIcon,
  HomeIcon,
  MadeForYouIcon,
  NewIcon,
  RecentlyAddedIcon,
  SearchIcon,
  SongsIcon,
  type NavIconProps,
} from '@/components/icons/NavIcons';
import { hrefFor } from '@/components/music/links';
import { LIBRARY_SECTIONS, type LibrarySection } from '@/data/music/library';
import { useLibraryPlaylists, useSignedIn } from '@/data/music/queries';
import { useSpotifyPlaylists } from '@/data/spotify/queries';
import { useExtensionUpdate } from '@/extension/useExtensionUpdate';
import { useSpotifySignedIn } from '@/extension/useSpotifyAuth';
import { isIosDevice } from '@/lib/platform';
import { useUi } from '@/state/ui';
import { AccountButton } from './AccountButton';

interface NavItem {
  to: string;
  label: string;
  Icon: (props: NavIconProps) => React.ReactNode;
}

const PRIMARY: NavItem[] = [
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/new', label: 'New', Icon: NewIcon },
  { to: '/library', label: 'Library', Icon: AllPlaylistsIcon },
];

const LIBRARY_ICONS: Record<Exclude<LibrarySection, 'playlists'>, NavItem['Icon']> = {
  recent: RecentlyAddedIcon,
  artists: ArtistsIcon,
  albums: AlbumsIcon,
  songs: SongsIcon,
  'made-for-you': MadeForYouIcon,
};

const LIBRARY: NavItem[] = (Object.keys(LIBRARY_ICONS) as (keyof typeof LIBRARY_ICONS)[]).map((section) => ({
  to: `/library/${section}`,
  label: LIBRARY_SECTIONS[section].title,
  Icon: LIBRARY_ICONS[section],
}));

// A sidebar row; NavLink sets aria-current on the page's own row.
const item =
  'group flex h-9 items-center gap-2 mb-0.5 p-1 rounded-nav type-body-reduced text-primary hover:bg-quinary aria-[current=page]:bg-nav-selected';
// Apple's glyphs, drawn at 24px (their 24-unit box), which the user preferred to Apple's own 28px.
const icon = 'inline-grid size-6 flex-none place-items-center text-primary group-aria-[current=page]:text-key';
const navLabel = 'min-w-0 truncate';
// "Library", "Playlists" (report §1: 12px/15px 600, secondary, padding 4px 8px).
const sectionHeader = 'mt-4 px-2 py-1 type-callout-emphasized text-secondary';
const list = 'flex flex-col';

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate: () => void }) {
  return (
    <ul className={list}>
      {items.map(({ to, label, Icon }) => (
        <li key={to}>
          <PrefetchNavLink to={to} className={item} onClick={onNavigate}>
            <Icon size={24} className={icon} />
            <span className={navLabel}>{label}</span>
          </PrefetchNavLink>
        </li>
      ))}
    </ul>
  );
}

/** Library and Playlists (report §1): Local Library works everywhere; YouTube Artists/Albums/Playlists appear signed in. */
function LibraryNav({ signedIn, onNavigate }: { signedIn: boolean; onNavigate: () => void }) {
  const playlists = useLibraryPlaylists();
  const quickItems = signedIn
    ? LIBRARY
    : LIBRARY.filter((entry) => entry.to === '/library/recent' || entry.to === '/library/songs');
  return (
    <>
      <h2 className={sectionHeader}>Library</h2>
      <NavList items={quickItems} onNavigate={onNavigate} />
      <h2 className={sectionHeader}>Playlists</h2>
      <ul className={list}>
        <li>
          <PrefetchNavLink to="/library/playlists" className={item} onClick={onNavigate}>
            <AllPlaylistsIcon size={24} className={icon} />
            <span className={navLabel}>{LIBRARY_SECTIONS.playlists.title}</span>
          </PrefetchNavLink>
        </li>
        {signedIn &&
          playlists.data?.map((playlist) => (
            <li key={playlist.id}>
              <PrefetchNavLink to={hrefFor(playlist) ?? '/library/playlists'} className={item} onClick={onNavigate}>
                <span className={icon}>
                  <ListMusic size={17} strokeWidth={1.8} />
                </span>
                <span className={navLabel}>{playlist.title}</span>
              </PrefetchNavLink>
            </li>
          ))}
      </ul>
    </>
  );
}

/** Spotify's playlists, once the extension can read them as the user (prompt §7.1). */
function SpotifyNav({ onNavigate }: { onNavigate: () => void }) {
  const playlists = useSpotifyPlaylists();
  return (
    <>
      <h2 className={sectionHeader}>Spotify</h2>
      <ul className={list}>
        <li>
          <PrefetchNavLink to="/spotify" end className={item} onClick={onNavigate}>
            <AllPlaylistsIcon size={24} className={icon} />
            <span className={navLabel}>All Spotify Playlists</span>
          </PrefetchNavLink>
        </li>
        {playlists.data?.map((playlist) => (
          <li key={playlist.id}>
            <PrefetchNavLink to={`/spotify/playlist/${encodeURIComponent(playlist.id)}`} className={item} onClick={onNavigate}>
              <span className={icon}>
                <ListMusic size={17} strokeWidth={1.8} />
              </span>
              <span className={navLabel}>{playlist.name}</span>
            </PrefetchNavLink>
          </li>
        ))}
      </ul>
    </>
  );
}

const ios = isIosDevice();

/** The left glass sidebar (report §1); acts as a slide-in drawer below 768px. */
export function Sidebar() {
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  const update = useExtensionUpdate();
  const signedIn = useSignedIn();
  const spotifySignedIn = useSpotifySignedIn();
  const close = () => setDrawerOpen(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  return (
    <>
      {/* Below 768px (iPhone & iPad Split View) the sidebar is a drawer opened from the top bar's menu button. */}
      <nav
        id="main-nav-drawer"
        className="absolute inset-y-0 left-0 z-(--z-web-chrome) flex w-[calc(var(--web-navigation-width)+var(--safe-left))] flex-col pt-(--safe-top) glass-material max-md:w-[min(300px,82vw)] max-md:-translate-x-full max-md:shadow-glass max-md:transition-transform max-md:duration-(--duration-panel) max-md:ease-panel max-md:data-[open=true]:translate-none"
        data-open={drawerOpen}
        aria-label="Main"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          touchStartX.current = null;
          if (dx < -56) close();
        }}
      >
        <div
          className="mt-2 flex h-18 items-center justify-between pr-3 pl-5 [@media(orientation:landscape)_and_(max-height:540px)]:mt-0.5 [@media(orientation:landscape)_and_(max-height:540px)]:h-12"
          style={{ paddingLeft: 'max(20px, var(--safe-left))' }}
        >
          <PrefetchLink to="/home" className="inline-flex items-center gap-2 rounded-[6px] pl-1" aria-label="BitChord, Home" onClick={close}>
            {/* White on dark, as Apple's own wordmark; it follows the label colour so it stays visible in light. */}
            <LogoMark size={22} className="text-primary" />
            <span className="type-[700_19px/24px] tracking-[-0.01em]">BitChord</span>
          </PrefetchLink>
          <button
            className="hidden size-11 place-items-center rounded-full text-secondary hover:bg-quinary hover:text-primary max-md:grid"
            aria-label="Close menu"
            onClick={close}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-3 pl-5 [scrollbar-width:none]" style={{ paddingLeft: 'max(20px, var(--safe-left))' }}>
          <NavList items={PRIMARY} onNavigate={close} />
          <LibraryNav signedIn={signedIn} onNavigate={close} />
          {spotifySignedIn && <SpotifyNav onNavigate={close} />}
        </div>
        <div
          className="flex flex-col gap-2 pt-3 pr-3 pb-[max(20px,var(--safe-bottom))] pl-5"
          style={{ paddingLeft: 'max(20px, var(--safe-left))' }}
        >
          {ios ? (
            <PrefetchNavLink to="/settings" className={item} onClick={close}>
              <span className={icon}>
                <Smartphone size={18} />
              </span>
              <span className={navLabel}>iOS Setup &amp; Proxy</span>
            </PrefetchNavLink>
          ) : (
            <PrefetchNavLink to="/extension" className={item} onClick={close}>
              {/* Chrome's own toolbar glyph for extensions (Material "extension"). */}
              <span className={icon}>
                <MdOutlineExtension size={18} />
              </span>
              <span className={navLabel}>BitChord Extension</span>
              {update.state === 'available' && (
                <span className="ml-auto rounded-[10px] bg-key px-[7px] py-0.5 type-subhead-emphasized text-white" title={`Version ${update.latest.version} is available`}>
                  Update
                </span>
              )}
            </PrefetchNavLink>
          )}
          <AccountButton />
          <div className="flex items-center justify-between">
            <span className="ps-1 type-callout text-secondary">{ios ? 'iOS Web App' : 'BitChord Web'}</span>
            <PrefetchNavLink to="/settings" className="grid size-8 place-items-center rounded-nav text-secondary hover:bg-quinary hover:text-primary aria-[current=page]:bg-quinary aria-[current=page]:text-primary" aria-label="Settings" title="Settings" onClick={close}>
              <Settings size={17} strokeWidth={1.9} />
            </PrefetchNavLink>
          </div>
        </div>
      </nav>
      {drawerOpen && <div className="absolute inset-0 z-[calc(var(--z-web-chrome)-1)] hidden bg-scrim max-md:block" onClick={close} aria-hidden="true" />}
    </>
  );
}
