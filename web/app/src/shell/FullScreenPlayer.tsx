import { AudioLines, Check, Maximize, Minimize, Moon, Palette, RotateCcw, Sliders, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import {
  BackwardIcon,
  ForwardIcon,
  LyricsActiveIcon,
  LyricsIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  UpNextIcon,
} from '@/components/icons/Transport';
import { AudioVisualizer } from '@/components/music/AudioVisualizer';
import { ExplicitBadge } from '@/components/music/ExplicitBadge';
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { TrackMenu } from '@/components/music/TrackMenu';
import { albumHref } from '@/components/music/links';
import { MotionArtwork } from '@/components/music/MotionArtwork';
import { VideoSurface } from '@/components/music/VideoSurface';
import { useTrackMotion } from '@/data/apple/motionArt';
import { sizedArtwork } from '@/lib/artwork';
import { isIosDevice } from '@/lib/platform';
import { usePlayer } from '@/state/player';
import { useSleepTimer } from '@/state/sleepTimer';
import {
  useUi,
  type FullScreenArtStyle,
  type FullScreenBackdrop,
  type FullScreenLayout,
} from '@/state/ui';
import { useHasVideo, useVideo } from '@/state/video';
import { Credits, PageLink, pageLink } from './Lcd';
import { LyricsPanel } from './LyricsPanel';
import { MeshBackdrop } from './MeshBackdrop';
import { albumPageFor } from './nowPlayingLinks';
import { UpNext } from './UpNext';
import { MixWindowHighlight, NerdStats } from './NerdStats';
import { useScrubber } from './useScrubber';
import { VideoQuality } from './VideoQuality';
import { fadeForVolume, VolumeControl } from './VolumeControl';

function useBrowserFullScreen(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('fullscreenchange', onChange);
      return () => document.removeEventListener('fullscreenchange', onChange);
    },
    () => document.fullscreenElement !== null,
  );
}

/** The seek line under the track's names: thicker on hover, with the times beneath its ends. */
function Scrubber() {
  const { bar, elapsed, remaining, mixLabel, dragging, handlers } = useScrubber();
  return (
    <div className="group/scrub mt-3.5" data-dragging={dragging || undefined}>
      {/* A taller hit area than the line it carries. */}
      <div className="group/hit flex h-4 cursor-pointer touch-none items-center" {...handlers}>
        <div
          className="relative h-1 flex-1 overflow-hidden rounded-[999px] bg-quaternary transition-[height] duration-120 ease-in group-hover/hit:h-2 group-data-dragging/scrub:h-2"
          aria-hidden="true"
        >
          <MixWindowHighlight />
          <div
            ref={bar}
            className="relative size-full origin-left scale-x-(--progress) bg-secondary transition-[background-color] duration-120 ease-in [--progress:0] group-hover/hit:bg-primary group-data-dragging/scrub:bg-primary"
          />
        </div>
      </div>
      <div className="relative mt-0.5 flex justify-between type-[500_11px/14px] tabular-nums text-tertiary">
        <span ref={elapsed} />
        <span ref={mixLabel} className="pointer-events-none absolute inset-x-0 text-center text-secondary opacity-0" aria-hidden="true">
          Mixing
        </span>
        <span ref={remaining} />
      </div>
    </div>
  );
}

const transportButton =
  'grid place-items-center rounded-full transition-[background-color,scale] duration-100 ease-in enabled:hover:bg-quinary enabled:active:scale-90 disabled:opacity-40';
// Shuffle and repeat, when on: full white on the mesh, where red would clash.
const toggle = `${transportButton} size-9 text-tertiary aria-pressed:text-primary`;
const skip = `${transportButton} size-12 text-primary`;

/** Shuffle, previous, play/pause, next, repeat. No volume: the pill keeps that. */
function Transport() {
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayer.getState();

  return (
    <div className="mx-auto mt-[clamp(8px,1.6vh,16px)] mb-0 flex h-13 w-[min(100%,315px)] items-center justify-between">
      <button className={toggle} aria-label="Shuffle" aria-pressed={shuffle} onClick={toggleShuffle}>
        <ShuffleIcon size={30} />
      </button>
      <button className={skip} disabled={!hasTrack} aria-label="Previous" onClick={previous}>
        <BackwardIcon size={40} />
      </button>
      <button className={`${transportButton} size-14 text-primary`} disabled={!hasTrack} aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
        {playing ? <PauseIcon size={48} /> : <PlayIcon size={48} />}
      </button>
      <button className={skip} disabled={!hasTrack} aria-label="Next" onClick={next}>
        <ForwardIcon size={40} />
      </button>
      <button
        className={toggle}
        aria-label={repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat'}
        aria-pressed={repeat !== 'off'}
        onClick={cycleRepeat}
      >
        {repeat === 'one' ? <RepeatOneIcon size={30} /> : <RepeatIcon size={30} />}
      </button>
    </div>
  );
}

// Close, browser full screen, the column toggles and the speaker, in the corners.
const chromeButton =
  'grid size-8 max-md:size-11 place-items-center rounded-full text-secondary transition-[background-color,color] duration-100 ease-in hover:bg-quinary hover:text-primary';
const chrome = `absolute z-1 ${chromeButton}`;
const artworkLayer = 'absolute inset-0 size-full rounded-[inherit] object-cover opacity-0 transition-opacity duration-300 ease-in';
const ios = isIosDevice();

/** How long the pointer can rest before a playing music video hides its controls. */
const IDLE_MS = 3000;

/**
 * The full-screen player (report §7): the artwork on the left with the
 * track's names, the seek line and the transport under it; the lyrics, the
 * same am-lyrics panel as the side panel's, on the right; all over a mesh
 * gradient of the artwork's colours. With the lyrics closed, the artwork
 * column sits in the middle on its own, as Apple's does.
 *
 * A music video plays as Apple's do: on its own, it fills the window with
 * the names and transport over its foot, fading out while the pointer rests;
 * beside the lyrics or Up Next, it takes the artwork's place at 16:9.
 */
export function FullScreenPlayer() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  // The queue's row for what's playing: it carries the album and each artist's channel.
  const track = usePlayer((s) => {
    const entry = s.queue[s.index]?.track;
    return entry && entry.videoId === s.nowPlaying?.videoId ? entry : null;
  });
  // Apple's animated sleeve over the cover, as the phone's now-playing shows it.
  const motion = useTrackMotion(nowPlaying?.title, nowPlaying?.artist, track?.album?.name);
  const { pathname } = useLocation();
  const openedAt = useRef(pathname);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const setFullScreen = useUi((s) => s.setFullScreen);
  const visualizerMode = useUi((s) => s.visualizerMode);
  const cycleVisualizerMode = useUi((s) => s.cycleVisualizerMode);
  const setSleepTimerOpen = useUi((s) => s.setSleepTimerOpen);
  const setEqualizerOpen = useUi((s) => s.setEqualizerOpen);
  const setThemeModalOpen = useUi((s) => s.setThemeModalOpen);
  const fullScreenConfig = useUi((s) => s.fullScreenConfig);
  const setFullScreenConfig = useUi((s) => s.setFullScreenConfig);
  const resetFullScreenConfig = useUi((s) => s.resetFullScreenConfig);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const timerPreset = useSleepTimer((s) => s.preset);
  const video = useHasVideo(nowPlaying?.videoId);
  // The right-hand column: the lyrics, Up Next, or nothing. Lyrics toggle bottom left, Up Next bottom right.
  // A music video opens on its own, without the lyrics.
  const [panel, setPanel] = useState<'lyrics' | 'queue' | null>(() =>
    nowPlaying && useVideo.getState().videoId === nowPlaying.videoId ? null : 'lyrics',
  );
  // Once the listener picks a column, a video arriving late doesn't take it away.
  const picked = useRef(false);
  const [idle, setIdle] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const browserFullScreen = useBrowserFullScreen();
  const close = useRef<HTMLButtonElement>(null);
  // Whether this player put the page in the browser's full screen, so closing it leaves it again.
  const enteredBrowserFullScreen = useRef(false);

  // The column follows the toggle alone: whether this track has lyrics, and
  // from which provider, is the panel's own business to say.
  const showLyrics = panel === 'lyrics';
  const showQueue = panel === 'queue';
  const togglePanel = (p: 'lyrics' | 'queue') => {
    picked.current = true;
    setPanel((on) => (on === p ? null : p));
  };

  useEffect(() => {
    if (video && !picked.current) setPanel(null);
  }, [video]);

  const wake = () => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  };
  useEffect(() => {
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    return () => {
      if (enteredBrowserFullScreen.current && document.fullscreenElement) void document.exitFullscreen();
      opener?.focus({ preventScroll: true });
    };
  }, []);

  // A title, artist or album link went somewhere: get out of the way so the page shows.
  useEffect(() => {
    if (pathname !== openedAt.current) setFullScreen(false);
  }, [pathname, setFullScreen]);

  // Nothing left to show once the queue ends.
  useEffect(() => {
    if (!nowPlaying) setFullScreen(false);
  }, [nowPlaying, setFullScreen]);

  const toggleBrowserFullScreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      // The whole page, not this overlay: menus and dialogs portal to <body> and must stay visible.
      void document.documentElement.requestFullscreen().then(
        () => (enteredBrowserFullScreen.current = true),
        () => undefined,
      );
    }
  };

  if (!nowPlaying) return null;
  const { videoId, title, artist } = nowPlaying;
  const album = track?.album ?? null;
  // With a right-hand column; on narrow windows that column fills the screen and the controls sit under it, without the artwork.
  const column = showLyrics || showQueue;
  // A music video on its own fills the window.
  const theater = video && !column;
  // ...and hides the controls and the pointer while it plays undisturbed.
  const hidden = theater && playing && idle ? ' pointer-events-none opacity-0' : '';
  const corner = `${chrome} transition-[background-color,color,opacity] duration-300${hidden}`;

  return (
    <div
      // Over everything but menus and dialogs, which portal above it. The on-dark colours come from tokens.css (data-full-screen).
      // --art, the artwork's side: Apple's 461px at 1440px wide, and never taller than the screen leaves room for.
      className="fixed inset-0 z-[calc(var(--z-contextual-menus)-2)] isolate animate-enter overflow-hidden text-primary [--art:min(32vw,calc(100dvh-330px),720px)] motion-reduce:[animation-name:fade-in] max-md:[--art:min(78vw,calc(100dvh-350px),380px)]"
      role="dialog"
      aria-modal="true"
      aria-label="Now Playing"
      data-full-screen
      data-paused={!playing || undefined}
      onPointerMove={wake}
      onPointerDown={wake}
      onKeyDown={wake}
      style={theater && playing && idle ? { cursor: 'none' } : undefined}
    >
      {fullScreenConfig.backdrop === 'mesh' && (
        <>
          <MeshBackdrop artworkUrl={nowPlaying.artworkUrl} playing={playing} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-2 opacity-65 transition-colors duration-500"
            style={{
              background:
                'radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--keyColor) 36%, transparent), transparent 62%), radial-gradient(circle at 82% 78%, color-mix(in srgb, var(--keyColor) 24%, transparent), transparent 58%)',
            }}
          />
        </>
      )}
      {fullScreenConfig.backdrop === 'amoled' && (
        <div aria-hidden="true" className="absolute inset-0 -z-2 bg-black" />
      )}
      {fullScreenConfig.backdrop === 'aurora' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-2 overflow-hidden bg-[#06060b]">
          <div className="absolute -top-1/4 -left-1/4 size-[90vmax] rounded-full bg-key/30 blur-[130px]" />
          <div className="absolute -right-1/4 -bottom-1/4 size-[85vmax] rounded-full bg-[#7c3aed]/25 blur-[130px]" />
          <div className="absolute top-1/3 left-1/3 size-[55vmax] rounded-full bg-[#00f2fe]/15 blur-[120px]" />
        </div>
      )}
      {fullScreenConfig.backdrop === 'blur' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-2 overflow-hidden bg-black">
          {nowPlaying.artworkUrl && (
            <img
              src={sizedArtwork(nowPlaying.artworkUrl, 300)}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full scale-125 object-cover opacity-55 blur-[72px] saturate-150"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      {theater && (
        <div className="absolute inset-0 animate-fade-in bg-black">
          <VideoSurface fit="contain" className="size-full" />
        </div>
      )}

      <button
        ref={close}
        className={`${corner} top-[max(16px,var(--safe-top))] left-[max(20px,var(--safe-left))]`}
        aria-label="Close"
        onClick={() => setFullScreen(false)}
      >
        <X size={20} />
      </button>
      <button
        className={`absolute top-[max(16px,var(--safe-top))] left-[calc(max(20px,var(--safe-left))+44px)] z-1 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-secondary backdrop-blur-md transition-all hover:bg-quaternary hover:text-primary ${
          customizerOpen ? 'bg-key text-white hover:bg-key hover:text-white' : 'bg-quinary'
        }${hidden}`}
        aria-label="Customize Full Screen Player"
        aria-pressed={customizerOpen}
        onClick={() => setCustomizerOpen((o) => !o)}
      >
        <Sparkles size={14} />
        <span>Customize</span>
      </button>
      {/* The music video's quality, just inside the full-screen button. */}
      {video && (
        <VideoQuality
          className={`absolute top-[max(18px,var(--safe-top))] z-1${hidden}${document.fullscreenEnabled && !ios ? ' right-15' : ' right-[max(20px,var(--safe-right))]'}`}
        />
      )}
      {document.fullscreenEnabled && !ios && (
        <button
          className={`${corner} top-[max(16px,var(--safe-top))] right-[max(20px,var(--safe-right))]`}
          aria-label={browserFullScreen ? 'Exit full screen' : 'Enter full screen'}
          onClick={toggleBrowserFullScreen}
        >
          {browserFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      )}

      {/* Apple's grid areas "controls lyrics": the artwork column, then the lyrics. */}
      <div
        className={
          theater
            ? `absolute inset-x-0 bottom-0 flex justify-center bg-[linear-gradient(to_top,rgb(0_0_0/0.72),rgb(0_0_0/0.35)_55%,transparent)] px-6 pt-32 pb-[max(64px,calc(var(--safe-bottom)+48px))] transition-opacity duration-300${hidden}`
            : `fullscreen-body grid h-full items-center justify-center gap-x-[clamp(48px,7vw,144px)] px-[clamp(24px,9vw,144px)] pt-[max(64px,calc(var(--safe-top)+44px))] pb-[max(64px,calc(var(--safe-bottom)+44px))] max-md:px-6 max-md:pb-[max(72px,calc(var(--safe-bottom)+56px))] ${
                column
                  ? fullScreenConfig.layout === 'flipped'
                    ? 'grid-cols-[minmax(0,38vw)_var(--art)] max-md:grid-cols-[minmax(0,1fr)] max-md:grid-rows-[minmax(0,1fr)_auto] max-md:items-stretch max-md:gap-y-4'
                    : 'grid-cols-[var(--art)_minmax(0,38vw)] max-md:grid-cols-[minmax(0,1fr)] max-md:grid-rows-[minmax(0,1fr)_auto] max-md:items-stretch max-md:gap-y-4'
                  : 'grid-cols-[var(--art)]'
              }`
        }
        data-lyrics={column || undefined}
        onTouchStart={(e) => {
          swipeStartY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(e) => {
          if (swipeStartY.current === null) return;
          const dy = (e.changedTouches[0]?.clientY ?? swipeStartY.current) - swipeStartY.current;
          swipeStartY.current = null;
          if (dy > 96 && !column) setFullScreen(false);
        }}
      >
        <section
          className={
            theater
              ? 'flex w-[min(720px,100%)] min-w-0 flex-col'
              : `fullscreen-player-col flex w-(--art) min-w-0 flex-col${column ? ' max-md:order-2 max-md:w-full' : ''}${
                  column && fullScreenConfig.layout === 'flipped' ? ' md:order-2' : ''
                }${
                  fullScreenConfig.layout === 'centered'
                    ? ' rounded-[26px] border border-white/15 bg-black/30 p-6 pb-5 max-md:p-5 max-md:pb-4 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.45)]'
                    : ''
                }`
          }
          aria-label="Player"
        >
          <div className="fullscreen-header-row flex flex-col">
            {/* Shrinks a touch while paused, as Apple's does. Beside a column, stays visible as a compact square above the title on phones. */}
            <div
              className={`fullscreen-art relative mx-auto transition-[scale,border-radius] duration-450 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none${
                fullScreenConfig.artStyle === 'vinyl'
                  ? ' rounded-full overflow-hidden border-[6px] border-black/75 shadow-[0_16px_48px_rgba(0,0,0,0.65)]'
                  : fullScreenConfig.artStyle === 'soft'
                    ? ' rounded-[28px] overflow-hidden shadow-[0_18px_48px_rgba(0,0,0,0.45)]'
                    : ' rounded-[10px]'
              }${
                fullScreenConfig.artStyle === 'minimal' && !video
                  ? ' w-[88px] max-md:w-[64px]'
                  : column
                    ? ' w-full max-md:mb-3 max-md:w-[clamp(64px,12dvh,104px)]'
                    : fullScreenConfig.layout === 'centered'
                      ? ' w-full max-w-[calc(var(--art)-48px)]'
                      : ' w-full'
              }${video ? ' aspect-video overflow-hidden bg-black' : ' aspect-square'}${playing ? '' : ' scale-92'}${theater ? ' hidden' : ''}`}
            >
              {nowPlaying.artworkUrl && (
                <>
                  <img
                    key={`glow-${nowPlaying.artworkUrl}`}
                    // The radiosity glow: a small copy, blurred and saturated, behind the artwork.
                    className={`${artworkLayer} -z-1 translate-y-2 scale-96 blur-[20px] saturate-200 data-loaded:opacity-40${playing ? ' animate-artwork-pulse' : ''}`}
                    src={sizedArtwork(nowPlaying.artworkUrl, 60)}
                    alt=""
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onLoad={(e) => e.currentTarget.setAttribute('data-loaded', '')}
                  />
                  <div
                    className="absolute inset-0 rounded-[inherit]"
                    style={
                      fullScreenConfig.artStyle === 'vinyl' && !video
                        ? { animation: 'spin 14s linear infinite', animationPlayState: playing ? 'running' : 'paused' }
                        : undefined
                    }
                  >
                    <img
                      key={nowPlaying.artworkUrl}
                      className={`${artworkLayer} bg-[#ffffff12] shadow-[0_4px_10px_#0000001a] data-loaded:opacity-100`}
                      src={sizedArtwork(nowPlaying.artworkUrl, 600)}
                      alt=""
                      referrerPolicy="no-referrer"
                      decoding="async"
                      onLoad={(e) => e.currentTarget.setAttribute('data-loaded', '')}
                    />
                    {/* Apple's motion artwork, over the cover once it's playing. */}
                    {motion && (
                      <MotionArtwork
                        key={motion.url}
                        motion={motion}
                        className="absolute inset-0 size-full rounded-[inherit] object-cover opacity-0 transition-opacity duration-600 ease-in data-ready:opacity-100"
                        playing={playing}
                      />
                    )}
                  </div>
                  {fullScreenConfig.artStyle === 'vinyl' && !video && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 m-auto size-11 rounded-full border-4 border-white/25 bg-black/80 shadow-inner"
                    />
                  )}
                </>
              )}
              {video && !theater && <VideoSurface className="absolute inset-0" />}
            </div>

            <div className={`fullscreen-track-details flex items-center gap-3${theater ? '' : ' mt-[clamp(16px,2.6vh,32px)]'}${column ? ' max-md:mt-0' : ''}`}>
              {/* As the mini player's: the title opens the album, each credited name its artist. */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center">
                  <PageLink
                    className={`min-w-0 max-w-full self-start truncate type-[600_17px/22px] ${pageLink}`}
                    href={albumHref(album?.id ?? null)}
                    resolve={() => albumPageFor(videoId, album, [title, artist].filter(Boolean).join(' '))}
                  >
                    {title}
                  </PageLink>
                  {track?.explicit && <ExplicitBadge size={14} />}
                </div>
                <span className="truncate type-title-3 text-secondary">
                  {artist && <Credits videoId={videoId} line={artist} artists={track?.artists ?? []} className={pageLink} />}
                  {artist && album?.name && ' — '}
                  {album?.name && (
                    <PageLink
                      className={pageLink}
                      href={albumHref(album.id ?? null)}
                      resolve={() => albumPageFor(videoId, album, [title, artist].filter(Boolean).join(' '))}
                    >
                      {album.name}
                    </PageLink>
                  )}
                </span>
                <NerdStats />
              </div>
              <FavoriteButton
                videoId={nowPlaying.videoId}
                className="grid size-8 flex-none place-items-center rounded-full bg-quinary text-primary hover:bg-quaternary"
                size={18}
              />
              {track && (
                <TrackMenu
                  track={track}
                  className="grid size-8 flex-none place-items-center rounded-full bg-quinary text-primary hover:bg-quaternary"
                  placement="above-end"
                />
              )}
            </div>
          </div>

          <div className="fullscreen-controls-col flex min-w-0 flex-col">
            <Scrubber />
            <Transport />
            {fullScreenConfig.showVisualizer && visualizerMode !== 'off' && (
              <div className="fullscreen-visualizer-wrap mx-auto mt-3 mb-1 w-full max-w-[320px] px-2 animate-fade-in">
                <AudioVisualizer mode={visualizerMode} className="w-full h-8" barCount={26} />
              </div>
            )}
          </div>
        </section>

        {showLyrics && (
          <section className="flex min-h-0 animate-fade-in self-stretch" aria-label="Lyrics">
            <LyricsPanel variant="full" />
          </section>
        )}
        {showQueue && (
          // Up Next in the right-hand column: the side panel's list, laid out as a column.
          <section
            className="flex min-h-0 animate-fade-in flex-col self-stretch [mask-image:linear-gradient(180deg,#000_calc(100%-80px),transparent)]"
            aria-label="Up Next"
          >
            <UpNext />
          </section>
        )}
      </div>

      <div className={`absolute bottom-[max(14px,var(--safe-bottom))] left-[max(20px,var(--safe-left))] z-20 flex items-center gap-1 transition-opacity duration-300${hidden}`}>
        <button
          className={`${chromeButton} aria-pressed:text-primary`}
          aria-label="Lyrics"
          aria-pressed={showLyrics}
          onClick={() => togglePanel('lyrics')}
        >
          {showLyrics ? <LyricsActiveIcon size={18} /> : <LyricsIcon size={18} />}
        </button>

        <button
          className={`${chromeButton} ${visualizerMode !== 'off' ? 'text-key' : ''}`}
          aria-label={`Visualizer (${visualizerMode})`}
          title={`Visualizer: ${visualizerMode.toUpperCase()} (Click to change mode)`}
          onClick={cycleVisualizerMode}
        >
          <AudioLines size={18} />
        </button>

        <button
          className={`${chromeButton} relative`}
          aria-label="Sleep Timer"
          title="Sleep Timer"
          onClick={() => setSleepTimerOpen(true)}
        >
          <Moon size={18} />
          {timerPreset !== 'off' && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-key" />
          )}
        </button>

        <button
          className={chromeButton}
          aria-label="Equalizer"
          title="Equalizer & Bass Boost"
          onClick={() => setEqualizerOpen(true)}
        >
          <Sliders size={18} />
        </button>

        <button
          className={chromeButton}
          aria-label="Themes & Styling"
          title="Themes & Accent Colors"
          onClick={() => setThemeModalOpen(true)}
        >
          <Palette size={18} />
        </button>

        <button
          className={`${chromeButton} ${customizerOpen ? 'text-key' : ''}`}
          aria-label="Customize Full Screen Player"
          title="Customize Full Screen Style"
          aria-pressed={customizerOpen}
          onClick={() => setCustomizerOpen((o) => !o)}
        >
          <Sparkles size={18} />
        </button>
      </div>

      {/* Inline Mochy-Style Full-Screen Customizer Panel */}
      {customizerOpen && (
        <div
          className="absolute bottom-[max(60px,calc(var(--safe-bottom)+52px))] left-[max(20px,var(--safe-left))] z-30 max-h-[calc(100dvh-max(76px,calc(var(--safe-top)+var(--safe-bottom)+68px)))] w-[min(340px,calc(100vw-40px))] overflow-y-auto overscroll-contain animate-spring-popup rounded-[18px] border border-white/15 bg-black/85 p-4 text-primary shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-2xl [@media(orientation:landscape)_and_(max-height:540px)]:w-[min(460px,calc(100vw-40px))]"
          role="dialog"
          aria-label="Customize Full Screen Player"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-key" />
              <span className="type-callout-medium font-semibold text-white">Full-Screen Style</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFullScreenConfig}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/75 hover:bg-white/20 hover:text-white"
              >
                <RotateCcw size={11} /> Reset
              </button>
              <button
                type="button"
                aria-label="Close Customizer"
                onClick={() => setCustomizerOpen(false)}
                className="grid size-6 place-items-center rounded-full bg-white/10 text-white/75 hover:bg-white/20 hover:text-white"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 text-xs">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-white/55 uppercase">
                Artwork Style
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { id: 'classic', label: 'Classic' },
                  { id: 'vinyl', label: 'Vinyl' },
                  { id: 'soft', label: 'Soft' },
                  { id: 'minimal', label: 'Minimal' },
                ] as const satisfies readonly { id: FullScreenArtStyle; label: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFullScreenConfig({ artStyle: opt.id })}
                    className={`rounded-[8px] py-1.5 font-medium transition-colors ${
                      fullScreenConfig.artStyle === opt.id
                        ? 'bg-key text-white'
                        : 'bg-white/10 text-white/75 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-white/55 uppercase">
                Backdrop Theme
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { id: 'mesh', label: 'Mesh' },
                  { id: 'aurora', label: 'Aurora' },
                  { id: 'blur', label: 'Frosted' },
                  { id: 'amoled', label: 'AMOLED' },
                ] as const satisfies readonly { id: FullScreenBackdrop; label: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFullScreenConfig({ backdrop: opt.id })}
                    className={`rounded-[8px] py-1.5 font-medium transition-colors ${
                      fullScreenConfig.backdrop === opt.id
                        ? 'bg-key text-white'
                        : 'bg-white/10 text-white/75 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-white/55 uppercase">
                Stage Layout
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'split', label: 'Apple Split' },
                  { id: 'flipped', label: 'Mochy Flip' },
                  { id: 'centered', label: 'Glass Card' },
                ] as const satisfies readonly { id: FullScreenLayout; label: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFullScreenConfig({ layout: opt.id })}
                    className={`rounded-[8px] py-1.5 font-medium transition-colors ${
                      fullScreenConfig.layout === opt.id
                        ? 'bg-key text-white'
                        : 'bg-white/10 text-white/75 hover:bg-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-[10px] bg-white/10 px-3 py-2">
              <span className="font-medium text-white/90">Show Audio Visualizer</span>
              <span
                className={`grid size-5 place-items-center rounded-md transition-colors ${
                  fullScreenConfig.showVisualizer ? 'bg-key text-white' : 'bg-white/15 text-transparent'
                }`}
              >
                <Check size={12} />
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={fullScreenConfig.showVisualizer}
                onChange={(e) => setFullScreenConfig({ showVisualizer: e.target.checked })}
              />
            </label>
          </div>
        </div>
      )}
      {/* Up Next, with the speaker beside it: the level slides in over Up Next, as it does in the pill. */}
      <div
        className={`group/actions absolute right-[max(20px,var(--safe-right))] bottom-[max(14px,var(--safe-bottom))] z-20 flex items-center [--volume-gap:36px] transition-opacity duration-300${hidden}`}
        data-volume-open={volumeOpen || undefined}
        onPointerLeave={() => setVolumeOpen(false)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setVolumeOpen(false);
        }}
      >
        <button
          className={`${chromeButton} ${fadeForVolume} aria-pressed:text-primary`}
          aria-label="Up Next"
          aria-pressed={showQueue}
          onClick={() => togglePanel('queue')}
        >
          <UpNextIcon size={18} />
        </button>
        {!ios && <VolumeControl open={volumeOpen} onOpen={() => setVolumeOpen(true)} className={chromeButton} iconSize={18} />}
      </div>
    </div>
  );
}
