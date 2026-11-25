import { create } from 'zustand';
import { LYRICS_SOURCES, orderedSources, type LyricsSourceId } from './sources';

/**
 * Which lyric providers are asked, and in what order (the desktop's lyric
 * settings). Kept in localStorage; a source added in a later build lands
 * where a fresh install would put it (sources.orderedSources).
 */
interface LyricsSettings {
  order: LyricsSourceId[];
  disabled: LyricsSourceId[];
  /** Keep looking past a line-timed answer for a word-timed one (LyricsRepository.prioritizeSyllableSync). */
  preferSyllables: boolean;
  /** Only import/display time-synced lyrics (skips plain text fallbacks like Genius). */
  syncedOnly: boolean;
  /** Automatically translate non-target-language lyrics below each line. */
  autoTranslate: boolean;
  /** Target BCP-47 language code for lyric translation (e.g. 'en', 'hi', 'es'). */
  translateLang: string;
  /** PaxSenix's Spotify and Musixmatch routes need the user's own key. */
  paxsenixKey: string;
  setEnabled: (id: LyricsSourceId, on: boolean) => void;
  move: (id: LyricsSourceId, by: -1 | 1) => void;
  setPreferSyllables: (on: boolean) => void;
  setSyncedOnly: (on: boolean) => void;
  setAutoTranslate: (on: boolean) => void;
  setTranslateLang: (lang: string) => void;
  setPaxsenixKey: (key: string) => void;
  reset: () => void;
}

const KEY = 'bitchord:lyrics';
type Saved = Pick<LyricsSettings, 'order' | 'disabled' | 'preferSyllables' | 'syncedOnly' | 'autoTranslate' | 'translateLang' | 'paxsenixKey'>;

const DEFAULTS: Saved = {
  order: LYRICS_SOURCES.map((s) => s.id),
  // The keyed routes do nothing without a key; off until one is entered.
  disabled: ['paxsenix-spotify', 'paxsenix-musixmatch'],
  preferSyllables: false,
  syncedOnly: true,
  autoTranslate: true,
  translateLang: 'en',
  paxsenixKey: '',
};

function load(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>;
    return { ...DEFAULTS, ...saved, order: orderedSources(saved.order ?? DEFAULTS.order) };
  } catch {
    return DEFAULTS;
  }
}

export const useLyricsSettings = create<LyricsSettings>()((set, get) => {
  const save = (change: Partial<Saved>) => {
    set(change);
    const { order, disabled, preferSyllables, syncedOnly, autoTranslate, translateLang, paxsenixKey } = get();
    localStorage.setItem(KEY, JSON.stringify({ order, disabled, preferSyllables, syncedOnly, autoTranslate, translateLang, paxsenixKey }));
  };
  return {
    ...load(),
    setEnabled: (id, on) => save({ disabled: on ? get().disabled.filter((d) => d !== id) : [...new Set([...get().disabled, id])] }),
    move: (id, by) => {
      const order = [...get().order];
      const at = order.indexOf(id);
      const to = at + by;
      if (at < 0 || to < 0 || to >= order.length) return;
      [order[at], order[to]] = [order[to]!, order[at]!];
      save({ order });
    },
    setPreferSyllables: (preferSyllables) => save({ preferSyllables }),
    setSyncedOnly: (syncedOnly) => save({ syncedOnly }),
    setAutoTranslate: (autoTranslate) => save({ autoTranslate }),
    setTranslateLang: (translateLang) => save({ translateLang }),
    setPaxsenixKey: (paxsenixKey) => save({ paxsenixKey: paxsenixKey.trim() }),
    reset: () => save(DEFAULTS),
  };
});

/** The sources that will be asked, in the order they're asked. */
export function enabledSources(): LyricsSourceId[] {
  const { order, disabled } = useLyricsSettings.getState();
  return order.filter((id) => !disabled.includes(id));
}
