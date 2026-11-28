// Registers <am-lyrics>.
import '@uimaxbai/am-lyrics/am-lyrics.js';
import { Check, ChevronDown, Download, Languages, Loader2, Minus, Settings2, Speech } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useCanvas } from '@/data/spotify/canvas';
import { getBridge } from '@/extension/bridge';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '@/components/Menu';
import { LyricClock } from '@/lyrics/clock';
import { onUngrantedChange, ungrantedOrigins } from '@/lyrics/http';
import type { SourceState } from '@/lyrics/repository';
import { enabledSources, useLyricsSettings } from '@/lyrics/settings';
import { sourceById, type LyricsSourceId } from '@/lyrics/sources';
import { translateTtml } from '@/lyrics/translate';
import { useLyrics, useLyricsUi } from '@/lyrics/useLyrics';
import { getAudio, getPlayhead, usePlayer } from '@/state/player';
import { useThemeSettings } from '@/lib/theme';
import { useUi, type AppUiMode } from '@/state/ui';
import { LyricsSettings } from './LyricsSettings';

type AmLyricsElement = HTMLElement & {
  currentTime: number;
  ttml?: string;
  interpolate: boolean;
  autoScroll: boolean;
  highlightColor: string;
  fontFamily?: string;
  noAutoAlternates?: boolean;
  showTranslation?: boolean;
  showRomanization?: boolean;
  downloadFormat?: string;
  toggleRomanization?: () => void;
  toggleTranslation?: () => void;
  downloadLyrics?: () => void;
  requestUpdate?: () => void;
  updateComplete?: Promise<unknown>;
};

/**
 * am-lyrics' own footer offers to fetch from its own providers; ours decide
 * (prompt §10.2). It stays in the layout, only unseen: am-lyrics measures its
 * scroll range to the footer, and `display: none` collapsed that range to zero,
 * so the lyrics never scrolled.
 */
const HIDE_FOOTER = '.lyrics-footer { visibility: hidden !important; pointer-events: none !important; }';

/** The phone's lyric typeface (@font-face in styles/global.css), then the app's. */
const LYRIC_FONT = "'ISOpod SF Pro Display', 'DM Sans', system-ui, sans-serif";

function lyricFontForUi(uiMode: AppUiMode): string {
  switch (uiMode) {
    case 'editorial':
      return "'Playfair Display', Georgia, 'Times New Roman', serif";
    case 'secondary':
      return "'Space Grotesk', 'DM Sans', 'Arial Black', system-ui, sans-serif";
    case 'bento':
      return "-apple-system, BlinkMacSystemFont, 'ISOpod SF Pro Display', 'DM Sans', system-ui, sans-serif";
    case 'retro':
      return "'Lucida Grande', 'Trebuchet MS', 'ISOpod SF Pro Display', system-ui, sans-serif";
    case 'anime':
      return "'M PLUS Rounded 1c', 'ISOpod SF Pro Display', 'DM Sans', system-ui, sans-serif";
    default:
      return LYRIC_FONT;
  }
}

function lyricAnimationsForUi(uiMode: AppUiMode): string {
  const reduced =
    '@media (prefers-reduced-motion: reduce) { .lyrics-container, .lyrics-line, .lyrics-line.active, .lyrics-line.lyrics-activest { animation: none !important; transition: none !important; transform: none !important; } }';
  const baseStage = `
    @keyframes lp-stage-in {
      from { opacity: 0; transform: translate3d(0, 8px, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    .lyrics-container {
      scroll-behavior: smooth;
      animation: lp-stage-in 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  `;
  switch (uiMode) {
    case 'secondary':
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, border-color 220ms ease, background-color 220ms ease !important;
          border-left: 4px solid transparent;
          border-radius: 8px;
          padding: 6px 12px;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: translate3d(8px, -2px, 0) scale(1.03);
          border-left-color: #2563EB;
          background-color: rgba(37, 99, 235, 0.1);
          text-shadow: none !important;
        }
        ${reduced}
      `;
    case 'editorial':
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms ease, border-color 340ms ease, letter-spacing 380ms ease !important;
          border-left: 3px solid transparent;
          padding: 5px 14px;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: translate3d(10px, 0, 0) scale(1.025);
          border-left-color: #DC2626;
          letter-spacing: -0.01em;
          text-shadow: none !important;
        }
        ${reduced}
      `;
    case 'bento':
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease, background-color 320ms ease, box-shadow 320ms ease !important;
          border-radius: 16px;
          padding: 7px 14px;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: scale(1.03) translate3d(0, -2px, 0);
          background-color: rgba(0, 102, 204, 0.12);
          box-shadow: 0 4px 16px rgba(0, 102, 204, 0.12);
          text-shadow: none !important;
        }
        ${reduced}
      `;
    case 'retro':
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, background 240ms ease, box-shadow 240ms ease !important;
          border-radius: 10px;
          padding: 6px 12px;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: scale(1.02) translate3d(3px, 0, 0);
          background: linear-gradient(180deg, rgba(91, 176, 255, 0.28), rgba(20, 110, 245, 0.16));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 2px 8px rgba(20, 110, 245, 0.15);
          text-shadow: none !important;
        }
        ${reduced}
      `;
    case 'anime':
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 340ms ease, text-shadow 340ms ease, border-color 320ms ease !important;
          border-left: 3px solid transparent;
          padding: 5px 12px;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: translate3d(10px, -2px, 0) scale(1.045);
          border-left-color: #FF3E8A;
          text-shadow: 0 0 20px rgba(255, 62, 138, 0.7), 0 0 42px rgba(0, 210, 255, 0.4) !important;
        }
        ${reduced}
      `;
    default:
      return `
        ${baseStage}
        .lyrics-line {
          transition: transform 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease, text-shadow 400ms ease !important;
        }
        .lyrics-line.active,
        .lyrics-line.lyrics-activest {
          transform: scale(1.038) translate3d(0, 0, 0);
          text-shadow: 0 0 24px rgba(255, 255, 255, 0.55), 0 0 48px rgba(250, 36, 60, 0.22) !important;
        }
        ${reduced}
      `;
  }
}

function readLyricColors(uiMode: AppUiMode): { highlight: string; base: string; muted: string } {
  if (typeof document === 'undefined') {
    return { highlight: '#ffffff', base: 'rgba(255,255,255,0.92)', muted: 'rgba(255,255,255,0.45)' };
  }
  const styles = getComputedStyle(document.documentElement);
  if (uiMode === 'primary') {
    return { highlight: '#ffffff', base: 'rgba(255,255,255,0.92)', muted: 'rgba(255,255,255,0.45)' };
  }
  const ink = styles.getPropertyValue('--systemPrimary').trim() || '#ffffff';
  const muted = styles.getPropertyValue('--systemSecondary').trim() || 'rgba(255,255,255,0.55)';
  const accent = styles.getPropertyValue('--keyColor').trim() || ink;
  return {
    highlight: uiMode === 'editorial' || uiMode === 'bento' || uiMode === 'retro' || uiMode === 'anime' ? accent : ink,
    base: ink,
    muted,
  };
}

let lyricFont: Promise<void> | null = null;
let lyricFontLoaded = false;

/**
 * Both weights, fetched once. am-lyrics measures its lines for the scroll and
 * the wipe, so it's only built once the face is in: built earlier, it laid
 * out in the fallback and then jumped when the font arrived. A slow network
 * gives up after 1.5 s and lets the fallback show.
 */
function loadLyricFont(): Promise<void> {
  lyricFont ??= Promise.race([
    Promise.all([document.fonts.load(`700 28px ${LYRIC_FONT}`), document.fonts.load(`400 28px ${LYRIC_FONT}`)]),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ])
    .catch(() => undefined)
    .then(() => {
      lyricFontLoaded = true;
    });
  return lyricFont;
}

function useLyricFont(): boolean {
  const [ready, setReady] = useState(lyricFontLoaded);
  useEffect(() => {
    if (!ready) void loadLyricFont().then(() => setReady(true));
  }, [ready]);
  return ready;
}

/**
 * am-lyrics fades the four lines either side of the current one (0.7, 0.58,
 * 0.46) and leaves every line past them at its base 0.8, so the fifth line on
 * came back brighter. Those stay at the farthest step. Gaps keep their own
 * opacity, and the library's !important rules (scrolling by hand, unsynced
 * lyrics) still win.
 */
const FAR_LINES =
  '.lyrics-line:not(.active):not(.pre-active):not(.lyrics-activest):not(.post-active-line):not(.next-active-line)' +
  ':not(.prev-2):not(.prev-3):not(.next-2):not(.next-3):not(.lyrics-gap) { opacity: 0.46; }';

const HIDE_HEADER = `
  /* Made by Rohan JM aka TheRedDragon */
  .lyrics-header {
    display: none !important;
  }
`;

/**
 * Apple Music-inspired fluid line transitions: active line gently scales with
 * a soft luminous radiosity aura, inactive lines step cleanly in opacity without
 * muddy blur, syllable highlights illuminate smoothly, and hover provides tactile feedback.
 */
const LYRIC_ANIMATIONS = `
  .lyrics-line {
    transform-origin: left center;
    transition:
      transform 0.42s cubic-bezier(0.2, 0, 0, 1),
      opacity 0.38s cubic-bezier(0.2, 0, 0, 1),
      text-shadow 0.38s cubic-bezier(0.2, 0, 0, 1) !important;
    will-change: transform, opacity;
    cursor: pointer;
    border-radius: 10px;
    padding: 4px 8px;
    margin: -4px -8px;
  }

  /* Active Lyric Line: Polished, stable Apple Music glow and subtle elevation */
  .lyrics-line.active,
  .lyrics-line.lyrics-activest {
    transform: scale(1.03) translate3d(0, 0, 0);
    opacity: 1 !important;
    text-shadow:
      0 0 20px rgba(255, 255, 255, 0.5),
      0 0 45px rgba(255, 255, 255, 0.25);
    filter: none !important;
  }

  /* Immediate neighboring lines: slightly dimmed, crisp and legible */
  .lyrics-line.pre-active,
  .lyrics-line.post-active-line,
  .lyrics-line.next-active-line {
    transform: scale(0.985) translate3d(0, 0, 0);
    opacity: 0.62 !important;
    filter: none !important;
  }

  /* Farther lines: clean opacity step, no greasy blur */
  .lyrics-line:not(.active):not(.pre-active):not(.lyrics-activest):not(.post-active-line):not(.next-active-line):not(.lyrics-gap) {
    transform: scale(0.97) translate3d(0, 0, 0);
    opacity: 0.36 !important;
    filter: none !important;
  }

  /* Tactile interactive hover: gentle brightening without twitching */
  .lyrics-line:not(.active):hover {
    opacity: 0.85 !important;
    background: rgba(255, 255, 255, 0.05);
  }

  /* Active press feedback on click to seek */
  .lyrics-line:active {
    transform: scale(0.985) translate3d(0, 0, 0) !important;
    transition-duration: 0.1s !important;
  }

  /* Instrumental gap dancing dots: soft gentle pulse */
  .lyrics-gap.active {
    animation: isopod-gap-pulse 1.6s ease-in-out infinite !important;
  }
  @keyframes isopod-gap-pulse {
    0%, 100% {
      opacity: 0.7;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.08);
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
  }

  /* Word-by-word active glow highlight (letting am-lyrics do native smooth sweep) */
  .lyrics-line.active .lyplus-word.active {
    text-shadow: 0 0 16px rgba(255, 255, 255, 0.85);
  }

  @media (prefers-reduced-motion: reduce) {
    .lyrics-line {
      transition: opacity 0.2s ease !important;
      transform: none !important;
      animation: none !important;
    }
    .lyrics-gap.active { animation: none !important; }
  }
`;

/**
 * The full-screen player's sizing (report §7): its line size, set on the host
 * by breakpoint, replaces all three of am-lyrics' container tiers, and the
 * current line sits a third of the way down. Scoped to `data-full`, so the
 * side panel keeps the library's own sizes.
 */
const FULL_SIZE =
  ':host([data-full]) .lyrics-container { --lyplus-font-size-base: var(--isopod-lyric-size, 34px);' +
  ' --am-lyrics-line-height: 1.2; --am-lyrics-line-spacing: calc(var(--isopod-lyric-size, 34px) * 0.7);' +
  ' --lyrics-scroll-padding-top: 30%; --am-lyrics-inline-padding: 0px; }';

/**
 * am-lyrics, exactly as it is, fed our TTML and a steered clock (prompt §10.2).
 * The clock reads the media time each frame, stamps the reading with when it
 * was taken, and is told about every seek and track change: the "lyric clock
 * dates readings by sample time" lesson. No React state per frame: the time is
 * written straight onto the element.
 */
function LyricsView({ ttml, full }: { ttml: string; full: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const element = useRef<AmLyricsElement | null>(null);
  const themeSheetRef = useRef<CSSStyleSheet | null>(null);
  const deck = usePlayer((s) => s.deck);
  const mixing = usePlayer((s) => s.mixing);
  const videoId = usePlayer((s) => s.nowPlaying?.videoId);
  const autoTranslate = useLyricsSettings((s) => s.autoTranslate);
  const translateLang = useLyricsSettings((s) => s.translateLang);
  const syncOffsetMs = useLyricsSettings((s) => s.syncOffsetMs);
  const uiMode = useUi((s) => s.uiMode);
  const brutalPalette = useUi((s) => s.brutalPalette);
  const customBrutalPrimary = useUi((s) => s.customBrutalPrimary);
  const customBrutalSecondary = useUi((s) => s.customBrutalSecondary);
  const { scheme, preset, amoled } = useThemeSettings();
  const [displayTtml, setDisplayTtml] = useState(ttml);

  useEffect(() => {
    setDisplayTtml(ttml);
    if (!autoTranslate) return;
    const abort = new AbortController();
    void translateTtml(ttml, translateLang, abort.signal)
      .then((next) => {
        if (!abort.signal.aborted) setDisplayTtml(next);
      })
      .catch(() => {
        // Keep original lyrics visible when translation fails or aborts.
      });
    return () => abort.abort();
  }, [ttml, autoTranslate, translateLang]);

  // Created by hand, with its TTML set before it's attached: am-lyrics starts
  // loading the moment it connects, and through React the properties arrive
  // a beat later, so its first load went to its own providers with no title
  // and finished after ours, wiping it.
  useEffect(() => {
    const el = document.createElement('am-lyrics') as AmLyricsElement;
    el.noAutoAlternates = autoTranslate;
    el.showTranslation = autoTranslate;
    el.ttml = displayTtml;
    el.interpolate = true;
    el.autoScroll = true;
    const colors = readLyricColors(uiMode);
    el.highlightColor = colors.highlight;
    el.fontFamily = lyricFontForUi(uiMode);
    el.className = 'block min-h-0 flex-1 overflow-hidden';
    el.style.setProperty('--am-lyrics-highlight-color', colors.highlight);
    el.style.setProperty('--lyplus-text-primary', colors.base);
    el.style.setProperty('--lyplus-text-secondary', colors.muted);
    el.toggleAttribute('data-full', full);
    const onLineClick = (event: Event) => {
      const timestamp = (event as CustomEvent<{ timestamp: number }>).detail?.timestamp;
      if (typeof timestamp === 'number') usePlayer.getState().seek(timestamp / 1000);
    };
    el.addEventListener('line-click', onLineClick);
    host.current?.append(el);
    element.current = el;
    const unmounted = new AbortController();
    void Promise.resolve(el.updateComplete).then(() => {
      const root = el.shadowRoot;
      if (!root) return;
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(HIDE_FOOTER + HIDE_HEADER + FAR_LINES + FULL_SIZE + LYRIC_ANIMATIONS);
      const themeSheet = new CSSStyleSheet();
      themeSheet.replaceSync(lyricAnimationsForUi(uiMode));
      themeSheetRef.current = themeSheet;
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet, themeSheet];
    });
    return () => {
      unmounted.abort();
      el.removeEventListener('line-click', onLineClick);
      el.remove();
      element.current = null;
    };
    // Mounted once; a new provider's TTML is handed over below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync lyric font and contrast colors whenever UI style, palette, or dark/light theme changes.
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const colors = readLyricColors(uiMode);
    el.fontFamily = lyricFontForUi(uiMode);
    el.highlightColor = colors.highlight;
    el.style.setProperty('--am-lyrics-highlight-color', colors.highlight);
    el.style.setProperty('--lyplus-text-primary', colors.base);
    el.style.setProperty('--lyplus-text-secondary', colors.muted);
    themeSheetRef.current?.replaceSync(lyricAnimationsForUi(uiMode));
  }, [uiMode, brutalPalette, customBrutalPrimary, customBrutalSecondary, scheme, preset, amoled]);

  useEffect(() => {
    const el = element.current;
    if (!el) return;
    el.noAutoAlternates = autoTranslate;
    el.showTranslation = autoTranslate;
    if (el.ttml !== displayTtml) el.ttml = displayTtml;
    el.requestUpdate?.();
  }, [displayTtml, autoTranslate]);

  useEffect(() => {
    const audio = getAudio();
    const el = element.current;
    if (!audio || !el) return;
    if (mixing) {
      // A loop mix plays the song from a deck while its element sits paused:
      // follow the mix's playhead, which loops and moves at the ramped tempo.
      // A loop's wrap (or the handover) is a jump on purpose, not drift to steer out.
      const start = getPlayhead()?.sec ?? audio.currentTime;
      const clock = new LyricClock(start * 1000);
      let discontinuity = 0;
      let last = start;
      let frame = 0;
      const tick = () => {
        const now = performance.now();
        const sec = getPlayhead()?.sec ?? last;
        if (sec < last - 0.15 || sec > last + 1) discontinuity++;
        last = sec;
        const rawMs = clock.frame(now, Math.trunc(sec * 1000), now, discontinuity);
        el.currentTime = Math.max(0, rawMs + syncOffsetMs);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
    }
    const clock = new LyricClock(audio.currentTime * 1000);
    let discontinuity = 0;
    let frame = 0;
    const tick = () => {
      const now = performance.now();
      // The reading and its stamp are taken together.
      const rawMs = clock.frame(now, Math.trunc(audio.currentTime * 1000), now, discontinuity);
      el.currentTime = Math.max(0, rawMs + syncOffsetMs);
      frame = requestAnimationFrame(tick);
    };
    const hold = () => {
      cancelAnimationFrame(frame);
      const ms = audio.currentTime * 1000;
      clock.hold(ms, performance.now());
      el.currentTime = Math.max(0, ms + syncOffsetMs);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      clock.restart();
      frame = requestAnimationFrame(tick);
    };
    const onSeeking = () => {
      discontinuity++;
      if (audio.paused) hold();
    };
    audio.addEventListener('seeking', onSeeking);
    audio.addEventListener('seeked', onSeeking);
    audio.addEventListener('pause', hold);
    audio.addEventListener('play', resume);
    if (audio.paused) hold();
    else resume();
    return () => {
      cancelAnimationFrame(frame);
      audio.removeEventListener('seeking', onSeeking);
      audio.removeEventListener('seeked', onSeeking);
      audio.removeEventListener('pause', hold);
      audio.removeEventListener('play', resume);
    };
  }, [deck, videoId, ttml, mixing, syncOffsetMs]);

  const setAutoTranslate = useLyricsSettings((s) => s.setAutoTranslate);
  const setTranslateLang = useLyricsSettings((s) => s.setTranslateLang);
  const [romanizedOn, setRomanizedOn] = useState(false);
  const [downloadFmt, setDownloadFmt] = useState('auto');

  // Fixed non-overlapping toolbar sits above the masked lyrics scroller so lines never collide with controls.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`flex shrink-0 items-center justify-between gap-2 pb-2 ${
          full ? 'px-1' : 'px-4 pt-1'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Toggle Romanization"
            aria-label="Toggle romanization"
            aria-pressed={romanizedOn}
            onClick={() => {
              const el = element.current;
              if (!el?.toggleRomanization) return;
              el.toggleRomanization();
              setRomanizedOn(Boolean(el.showRomanization));
            }}
            className={`grid size-8 place-items-center rounded-[8px] transition-colors cursor-pointer ${
              romanizedOn ? 'bg-key-bg text-white' : 'text-secondary hover:bg-quinary hover:text-primary'
            }`}
          >
            <Speech size={16} aria-hidden />
          </button>
          <button
            type="button"
            title={autoTranslate ? `Translation on (${translateLang === 'hinglish' ? 'Hinglish' : 'English'})` : 'Turn on lyrics translation'}
            aria-label="Toggle translation"
            aria-pressed={autoTranslate}
            onClick={() => setAutoTranslate(!autoTranslate)}
            className={`inline-flex h-8 items-center gap-1 rounded-[8px] px-2 transition-colors cursor-pointer ${
              autoTranslate ? 'bg-key-bg text-white' : 'text-secondary hover:bg-quinary hover:text-primary'
            }`}
          >
            <Languages size={16} aria-hidden />
            <span className="text-[11px] font-semibold">
              {translateLang === 'hinglish' ? 'Hinglish' : 'EN'}
            </span>
          </button>
          {autoTranslate && (
            <select
              aria-label="Translation language"
              value={translateLang}
              onChange={(e) => setTranslateLang(e.target.value)}
              className="h-8 rounded-[8px] border border-white/15 bg-quinary/70 px-2 text-[11px] font-medium text-primary outline-none hover:bg-quinary cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hinglish">Hinglish</option>
            </select>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Lyrics download format"
            value={downloadFmt}
            onChange={(e) => {
              setDownloadFmt(e.target.value);
              if (element.current) element.current.downloadFormat = e.target.value;
            }}
            className="h-8 rounded-[8px] border border-white/15 bg-quinary/70 px-2.5 type-callout text-primary outline-none hover:bg-quinary cursor-pointer"
          >
            <option value="auto">Auto</option>
            <option value="lrc">LRC</option>
            <option value="ttml">TTML</option>
            <option value="plain">Plain</option>
          </select>
          <button
            type="button"
            title="Download Lyrics"
            aria-label="Download lyrics"
            onClick={() => element.current?.downloadLyrics?.()}
            className="grid size-8 place-items-center rounded-[8px] text-secondary hover:bg-quinary hover:text-primary transition-colors cursor-pointer"
          >
            <Download size={16} aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={host}
        className={
          full
            ? 'flex min-h-0 flex-1 animate-[fade-in_360ms_ease-out] [mask-image:linear-gradient(180deg,transparent_0px,#000_28px,#000_55%,transparent)]'
            : 'flex min-h-0 flex-1 animate-[fade-in_360ms_ease-out] [mask-image:linear-gradient(180deg,transparent_0px,#000_20px,#000_92%,transparent)]'
        }
      />
    </div>
  );
}

function useUngranted(): string[] {
  return useSyncExternalStore(onUngrantedChange, () => [...ungrantedOrigins].join(','), () => '')
    .split(',')
    .filter(Boolean);
}

const NO_STATES: Partial<Record<LyricsSourceId, SourceState>> = {};

/** The provider picker: which provider these lyrics are from, and the others' answers for this track. */
function ProviderPicker({ current, full }: { current: LyricsSourceId | null; full: boolean }) {
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? '');
  const states = useLyricsUi((s) => s.states[videoId]) ?? NO_STATES;
  const picked = useLyricsUi((s) => s.picked[videoId]);
  const pick = useLyricsUi((s) => s.pick);
  const autoTranslate = useLyricsSettings((s) => s.autoTranslate);
  const translateLang = useLyricsSettings((s) => s.translateLang);
  const setAutoTranslate = useLyricsSettings((s) => s.setAutoTranslate);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [settings, setSettings] = useState(false);
  const close = useCallback(() => setAnchor(null), []);
  const label = current ? sourceById(current)?.label : 'Lyrics';

  return (
    // In full screen the picker sits quietly above the lines, shown on hover.
    <div
      className={
        full
          ? 'flex items-center justify-between pb-1 opacity-0 transition-opacity duration-200 group-hover/panel:opacity-100 focus-within:opacity-100'
          : 'flex items-center justify-between px-4 pt-4 pb-1'
      }
    >
      <button
        className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 type-callout-emphasized text-secondary hover:bg-quinary"
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={[
            'inline-flex h-7 cursor-pointer items-center gap-1 rounded-[8px] px-2 type-caption-emphasized transition-colors',
            autoTranslate ? 'bg-key-bg text-white' : 'text-secondary hover:bg-quinary',
          ].join(' ')}
          aria-pressed={autoTranslate}
          aria-label={autoTranslate ? `Auto-translate on (${translateLang.toUpperCase()})` : 'Turn on auto-translate lyrics'}
          title={autoTranslate ? `Auto-translate on (${translateLang.toUpperCase()})` : 'Auto-translate lyrics'}
          onClick={() => setAutoTranslate(!autoTranslate)}
        >
          <Languages size={13} aria-hidden />
          <span>{translateLang.split('-')[0]!.toUpperCase()}</span>
        </button>
        <button
          className="grid size-7 place-items-center rounded-[8px] text-secondary hover:bg-quinary"
          aria-label="Lyric settings"
          onClick={() => setSettings(true)}
        >
          <Settings2 size={16} />
        </button>
      </div>
      {anchor && (
        <Menu anchor={anchor} placement="below-end" onClose={close} label="Lyrics provider">
          <MenuItem checked={!picked} onSelect={() => (close(), pick(videoId, null))}>
            Best available
          </MenuItem>
          <MenuSeparator />
          <MenuHeader>Providers</MenuHeader>
          {enabledSources().map((id) => {
            const state = states[id];
            return (
              <MenuItem
                key={id}
                checked={picked === id}
                trailing={
                  state === 'pending' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : state === 'found' ? (
                    <Check size={13} />
                  ) : state === 'missing' ? (
                    <Minus size={13} />
                  ) : undefined
                }
                onSelect={() => (close(), pick(videoId, id))}
              >
                {sourceById(id)?.label}
              </MenuItem>
            );
          })}
          <MenuSeparator />
          <MenuItem onSelect={() => (close(), setSettings(true))}>Lyric Settings…</MenuItem>
        </Menu>
      )}
      {settings && <LyricsSettings onClose={() => setSettings(false)} />}
    </div>
  );
}

function PermissionNotice({ origins }: { origins: string[] }) {
  const names = origins.map((o) => new URL(o).host.replace(/^www\./, ''));
  return (
    <div className="mx-4 my-1.5 flex items-center gap-2.5 rounded-[10px] bg-quinary px-2.5 py-2 type-callout text-secondary">
      <span>
        {names.slice(0, 2).join(', ')}
        {names.length > 2 ? ` and ${names.length - 2} more` : ''} need the extension’s permission.
      </span>
      <button
        className="flex-none type-callout-emphasized text-key"
        // The notice stays until the extension confirms the grant (checked when this tab comes back).
        onClick={() => void getBridge()?.call('lyrics.requestPermissions', { origins })}
      >
        Allow
      </button>
    </div>
  );
}

/**
 * The track's Spotify Canvas behind the lyrics, dimmed so they stay legible.
 * Muted and looping, it fades in once it can play and pauses with the music.
 *
 * The blur runs on a quarter-size video that is then scaled up 4×: a 3px blur
 * there reads as about 12px on screen for a sixteenth of the pixels, which is
 * what keeps a blurred, playing video cheap. The 5% overscan on each side
 * keeps the soft edges out of view.
 */
function CanvasBackdrop({ url }: { url: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  useEffect(() => setReady(false), [url]);
  useEffect(() => {
    const el = video.current;
    if (!el || !ready) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, ready]);
  return (
    <video
      ref={video}
      key={url}
      className="absolute top-[-5%] left-[-5%] -z-1 size-[27.5%] origin-[0_0] scale-400 object-cover opacity-0 blur-[3px] transition-opacity duration-600 [mask-image:linear-gradient(to_bottom,rgb(0_0_0/1),rgb(0_0_0/0.85))] data-ready:opacity-85"
      data-ready={ready || undefined}
      src={url}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      onError={() => setReady(false)}
    />
  );
}

const panel = 'group/panel relative isolate flex min-h-0 flex-1 flex-col overflow-hidden';
// The full-screen player's column (report §7): lines 26px, then 30px from 980px, 36px from 1320px and 42px from 1680px.
const fullSizes =
  '[--isopod-lyric-size:26px] min-[980px]:[--isopod-lyric-size:30px] min-[1320px]:[--isopod-lyric-size:36px] min-[1680px]:[--isopod-lyric-size:42px]';

/**
 * The lyrics, with their provider picker and empty states: the side panel
 * (report §7), and the right-hand column of the full-screen player, where the
 * lines are larger and the player's mesh stands in for the Canvas.
 */
export function LyricsPanel({ variant = 'panel' }: { variant?: 'panel' | 'full' }) {
  const lyrics = useLyrics();
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? '');
  // A provider picked by hand that came back with nothing is named in the
  // empty state: the lyrics didn't go missing, this one provider hasn't got them.
  const picked = useLyricsUi((s) => s.picked[videoId]);
  const ungranted = useUngranted();
  const canvas = useCanvas();
  const fontReady = useLyricFont();
  const result = lyrics.data;
  const full = variant === 'full';
  const empty = full
    ? 'flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center type-title-3 text-secondary'
    : 'flex flex-1 flex-col items-center justify-center gap-2 px-6 pb-20 text-center type-[400_12px/16px] text-secondary';
  const emptyTitle = full ? 'type-title-1-emphasized text-primary' : 'type-[600_12px/16px]';

  return (
    <div className={full ? `${panel} ${fullSizes}` : panel}>
      {canvas && variant === 'panel' && <CanvasBackdrop url={canvas} />}
      <ProviderPicker current={result?.source ?? null} full={full} />
      {/* Only worth raising when nothing was found: then the hosts behind the extension might have it. */}
      {ungranted.length > 0 && !result && !lyrics.isFetching && <PermissionNotice origins={ungranted} />}
      {!hasTrack ? (
        <div className={empty}>
          <p className={emptyTitle}>No lyrics available</p>
          <p>Play a song to see its lyrics here.</p>
        </div>
      ) : (lyrics.isPending && lyrics.fetchStatus !== 'idle') || (result && !fontReady) ? (
        <div className={empty}>
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : result ? (
        <LyricsView ttml={result.ttml} full={full} />
      ) : picked ? (
        <div className={empty}>
          <p className={emptyTitle}>Not on {sourceById(picked)?.label ?? 'this provider'}</p>
          <p>This provider hasn’t got this song. Pick another, or Best available, in the list above.</p>
        </div>
      ) : (
        <div className={empty}>
          <p className={emptyTitle}>No lyrics available</p>
          <p>None of the lyric providers has this song. Try another in the list above.</p>
        </div>
      )}
    </div>
  );
}
