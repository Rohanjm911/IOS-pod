import { Clock, Search, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSuggestions } from '@/data/music/queries';
import { recentEntryKey, useRecentSearches } from '@/data/music/recentSearches';
import type { MusicItem } from '@/data/music/types';
import { Artwork } from './Artwork';
import { hrefFor } from './links';
import { playTrack, toTrack } from './play';
import { TrackMenu } from './TrackMenu';

type Option =
  | { kind: 'query'; text: string; typed: string; rest: string }
  | { kind: 'item'; item: MusicItem }
  | { kind: 'recent-query'; text: string }
  | { kind: 'recent-item'; item: MusicItem };

/**
 * The centred search field and its suggestions (report §6): a pill field, and
 * a glass dropdown of recent searches when empty or live completions + results
 * while typing. Arrow keys move through it; Enter picks; Escape closes.
 */
export function SearchField({ initial, onSearch }: { initial: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const navigate = useNavigate();
  const suggestions = useSuggestions(open ? value : '');
  const recentEntries = useRecentSearches((s) => s.entries);
  const { addQuery, addItem, remove: removeRecent, clear: clearRecent } = useRecentSearches.getState();
  // A suggestion's track menu takes focus when it opens (Menu focuses its
  // first item), which would otherwise read as the field blurring and close
  // the dropdown under the open menu. While a menu is open the blur close is
  // held off; when the menu closes, its pick is done, so the dropdown
  // closes with it.
  const menuOpen = useRef(false);
  const onMenuOpenChange = useCallback((isOpen: boolean) => {
    const wasOpen = menuOpen.current;
    menuOpen.current = isOpen;
    if (!isOpen && wasOpen) setOpen(false);
  }, []);

  useEffect(() => setValue(initial), [initial]);

  const trimmed = value.trim();
  const showingRecent = open && trimmed.length === 0 && recentEntries.length > 0;
  const options: Option[] = showingRecent
    ? recentEntries.map((entry) =>
        entry.kind === 'query' ? { kind: 'recent-query', text: entry.text } : { kind: 'recent-item', item: entry.item },
      )
    : [
        ...(suggestions.data?.queries ?? []).map((q) => ({ kind: 'query' as const, ...q })),
        ...(suggestions.data?.items ?? []).map((item) => ({ kind: 'item' as const, item })),
      ];
  const showList = open && options.length > 0 && (trimmed.length > 0 || showingRecent);

  const pick = (option: Option | undefined) => {
    if (menuOpen.current) return;
    setOpen(false);
    setActive(-1);
    if (!option) {
      if (trimmed) addQuery(trimmed);
      return onSearch(trimmed);
    }
    if (option.kind === 'query' || option.kind === 'recent-query') {
      addQuery(option.text);
      setValue(option.text);
      return onSearch(option.text);
    }
    addItem(option.item);
    const href = hrefFor(option.item);
    if (href) navigate(href);
    else playTrack(option.item);
  };

  return (
    <div className="relative w-[min(492px,100%)]">
      <form
        className="relative flex items-center"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          pick(active >= 0 ? options[active] : undefined);
        }}
      >
        <Search size={15} strokeWidth={2.4} className="pointer-events-none absolute left-2.5 text-secondary" aria-hidden="true" />
        <input
          ref={input}
          className="h-[38px] w-full rounded-pill border border-search-border bg-page pt-1.5 pr-[30px] pb-[5px] pl-7 type-body text-primary placeholder:text-tertiary [&::-webkit-search-cancel-button]:hidden"
          type="search"
          value={value}
          placeholder="Artists, Songs, Lyrics, and More"
          aria-label="Search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setOpen(true);
            void import('@/playback/youtube/innertube').then((m) => m.getBrowseInnertube().catch(() => undefined));
          }}
          onBlur={() => setTimeout(() => { if (!menuOpen.current) setOpen(false); }, 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="absolute right-[9px] grid size-4 place-items-center rounded-full bg-tertiary text-page"
            aria-label="Clear"
            onClick={() => {
              setValue('');
              setOpen(true);
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X size={12} strokeWidth={3} />
          </button>
        )}
      </form>
      {showList && (
        // The dropdown: glass sheet directly under the field.
        <ul
          id={listId}
          className="absolute top-[calc(100%+3px)] left-0 z-(--z-contextual-menus) max-h-[min(700px,70vh)] w-[min(360px,100%)] max-sm:w-full overflow-y-auto rounded-[9px] border border-[#00000033] bg-thick-material py-1.5 shadow-[inset_0_0_0_1px_#ffffff33,0_8px_40px_#0000008c] [backdrop-filter:blur(60px)_saturate(2.2)]"
          role="listbox"
        >
          {showingRecent && (
            <li className="mx-2.5 flex items-center justify-between pt-1 pb-1.5">
              <span className="type-caption-emphasized uppercase tracking-wide text-secondary">Recent Searches</span>
              <button
                type="button"
                className="cursor-pointer type-callout-emphasized text-key hover:underline"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => clearRecent()}
              >
                Clear
              </button>
            </li>
          )}
          {options.map((option, i) => {
            const isQuery = option.kind === 'query' || option.kind === 'recent-query';
            const isRecent = option.kind === 'recent-query' || option.kind === 'recent-item';
            const item = option.kind === 'item' || option.kind === 'recent-item' ? option.item : null;
            const playable = item !== null && (item.kind === 'song' || item.kind === 'video');
            const recentKey = isRecent
              ? recentEntryKey(
                  option.kind === 'recent-query'
                    ? { kind: 'query', text: option.text }
                    : { kind: 'item', item: option.item },
                )
              : null;
            return (
              <li
                key={
                  option.kind === 'query'
                    ? `q-${option.text}`
                    : option.kind === 'recent-query'
                      ? `rq-${option.text}`
                      : option.kind === 'recent-item'
                        ? `ri-${option.item.id}`
                        : `i-${option.item.id}`
                }
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={
                  isQuery
                    ? isRecent
                      ? recentHint
                      : hint
                    : `${lockup} ${playable || isRecent ? lockupMenuCols : lockupCols}`
                }
                data-active={i === active || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(option)}
              >
                {isQuery ? (
                  <>
                    {option.kind === 'recent-query' ? (
                      <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <Search size={13} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    <span className="truncate text-primary group-data-active/option:text-white">
                      {option.kind === 'recent-query' ? (
                        option.text
                      ) : (
                        <>
                          <span>{option.typed}</span>
                          <span className="text-secondary group-data-active/option:text-white">{option.rest}</span>
                        </>
                      )}
                    </span>
                    {recentKey && (
                      <button
                        type="button"
                        aria-label={`Remove ${option.text} from recent searches`}
                        className="grid size-6 place-items-center rounded-full text-tertiary hover:bg-quinary hover:text-primary group-data-active/option:text-white/80 group-data-active/option:hover:bg-white/20"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(recentKey);
                        }}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )}
                  </>
                ) : (
                  item && (
                    <>
                      <div className="w-[46px]">
                        <Artwork
                          src={item.thumbnail}
                          displayWidth={46}
                          radius={item.kind === 'artist' ? '50%' : 'var(--radius-artwork-small)'}
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate type-body">{item.title}</span>
                        <span className="mt-px truncate type-callout text-secondary group-data-active/option:text-white">
                          {item.subtitle || kindLabel(item.kind)}
                        </span>
                      </div>
                      {recentKey ? (
                        <button
                          type="button"
                          aria-label={`Remove ${item.title} from recent searches`}
                          className="grid size-7 place-items-center rounded-full text-tertiary hover:bg-quinary hover:text-primary group-data-active/option:text-white/80 group-data-active/option:hover:bg-white/20"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecent(recentKey);
                          }}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      ) : (
                        playable && (
                          <TrackMenu
                            track={toTrack(item)}
                            onOpenChange={onMenuOpenChange}
                            className="grid size-7 place-items-center rounded-full text-secondary opacity-0 transition-opacity duration-100 ease-in group-hover/option:opacity-100 group-data-active/option:text-white focus-visible:opacity-100 hover:bg-quinary group-data-active/option:hover:bg-white/20 data-open:opacity-100"
                          />
                        )
                      )}
                    </>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// A suggestion row; hover or keyboard selection paints it in the key colour, white text.
const optionRow = 'group/option mx-1.5 cursor-default rounded-[3px] data-active:bg-key-bg data-active:text-white';
const hint = `${optionRow} grid grid-cols-[16px_minmax(0,1fr)] items-center gap-x-1.5 p-1 type-body text-secondary`;
const recentHint = `${optionRow} grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-1.5 p-1 type-body text-secondary`;
const lockup = `${optionRow} mt-1.5 grid items-center gap-x-2.5 p-1.5`;
const lockupCols = 'grid-cols-[46px_minmax(0,1fr)]';
const lockupMenuCols = 'grid-cols-[46px_minmax(0,1fr)_auto]';

function kindLabel(kind: MusicItem['kind']): string {
  return { song: 'Song', video: 'Video', album: 'Album', playlist: 'Playlist', 'spotify-playlist': 'Spotify Playlist', artist: 'Artist', episode: 'Episode', podcast: 'Podcast', unknown: '' }[kind];
}
