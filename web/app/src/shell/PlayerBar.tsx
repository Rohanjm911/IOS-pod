import { LayoutTemplate, Moon, Palette, PictureInPicture, Sliders, SlidersHorizontal } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Menu, MenuHeader, MenuItem } from '@/components/Menu';
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
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { TrackMenu } from '@/components/music/TrackMenu';
import { isIosDevice } from '@/lib/platform';
import { usePlayer } from '@/state/player';
import { useSleepTimer } from '@/state/sleepTimer';
import { PLAYER_STYLES, useUi } from '@/state/ui';
import { Lcd } from './Lcd';
import { fadeForVolume, VolumeControl } from './VolumeControl';

const control = 'grid place-items-center rounded-[6px] disabled:opacity-40 transition-transform duration-150 ease-out hover:scale-108 active:scale-92';
// Shuffle and repeat: secondary, and the key colour when on, as Apple's toggles.
const toggle = `${control} size-7 text-secondary aria-pressed:text-key`;
const transport = `${control} size-7 text-primary`;
const action = 'grid h-7 w-6 place-items-center rounded-[4px] text-primary aria-pressed:text-key transition-transform duration-150 ease-out hover:scale-108 active:scale-92';
// The actions the volume level slides in over: they fade out while it's open.
const fading = `${action} ${fadeForVolume}`;

const ios = isIosDevice();

/** Sleek contextual popover for audio and UI tools on landscape/compact views. */
function QuickToolsMenu({ className }: { className?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const setSleepTimerOpen = useUi((s) => s.setSleepTimerOpen);
  const setEqualizerOpen = useUi((s) => s.setEqualizerOpen);
  const setThemeModalOpen = useUi((s) => s.setThemeModalOpen);
  const toggleMiniPlayer = useUi((s) => s.toggleMiniPlayer);
  const miniPlayerOpen = useUi((s) => s.miniPlayerOpen);
  const playerStyle = useUi((s) => s.playerStyle);
  const setPlayerStyle = useUi((s) => s.setPlayerStyle);
  const timerPreset = useSleepTimer((s) => s.preset);
  const close = useCallback(() => setAnchor(null), []);

  const cyclePlayerStyle = () => {
    const idx = PLAYER_STYLES.findIndex((s) => s.id === playerStyle);
    const next = PLAYER_STYLES[(idx + 1) % PLAYER_STYLES.length]!;
    setPlayerStyle(next.id);
  };

  return (
    <>
      <button
        className={`${className} relative`}
        aria-label="Audio & Display Tools"
        title="Audio & Display Tools"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        data-open={anchor !== null || undefined}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(anchor ? null : e.currentTarget);
        }}
      >
        <SlidersHorizontal size={16} />
        {timerPreset !== 'off' && (
          <span className="absolute top-1 right-0.5 size-1.5 rounded-full bg-key" />
        )}
      </button>
      {anchor && (
        <Menu anchor={anchor} placement="above-end" onClose={close} label="Audio & Playback Tools">
          <MenuHeader>Audio & Display</MenuHeader>
          <MenuItem
            icon={<Moon size={15} />}
            onSelect={() => {
              close();
              setSleepTimerOpen(true);
            }}
            trailing={
              timerPreset !== 'off' ? (
                <span className="text-key text-xs font-semibold uppercase">{timerPreset}</span>
              ) : undefined
            }
          >
            Sleep Timer
          </MenuItem>
          <MenuItem
            icon={<Sliders size={15} />}
            onSelect={() => {
              close();
              setEqualizerOpen(true);
            }}
          >
            Equalizer & Bass
          </MenuItem>
          <MenuItem
            icon={<Palette size={15} />}
            onSelect={() => {
              close();
              setThemeModalOpen(true);
            }}
          >
            Themes & Colors
          </MenuItem>
          <MenuItem
            icon={<LayoutTemplate size={15} />}
            onSelect={() => {
              cyclePlayerStyle();
            }}
            trailing={
              <span className="text-key text-xs font-semibold">
                {PLAYER_STYLES.find((s) => s.id === playerStyle)?.label ?? playerStyle}
              </span>
            }
          >
            Player Style
          </MenuItem>
          <MenuItem
            icon={<PictureInPicture size={15} />}
            onSelect={() => {
              close();
              toggleMiniPlayer();
            }}
          >
            {miniPlayerOpen ? 'Close Mini Player' : 'Mini Player'}
          </MenuItem>
        </Menu>
      )}
    </>
  );
}

/** The floating glass player pill (iPad 768px+ & Desktop). */
export function PlayerBar() {
  const sidePanel = useUi((s) => s.sidePanel);
  const toggleSidePanel = useUi((s) => s.toggleSidePanel);
  const setSleepTimerOpen = useUi((s) => s.setSleepTimerOpen);
  const setEqualizerOpen = useUi((s) => s.setEqualizerOpen);
  const setThemeModalOpen = useUi((s) => s.setThemeModalOpen);
  const toggleMiniPlayer = useUi((s) => s.toggleMiniPlayer);
  const miniPlayerOpen = useUi((s) => s.miniPlayerOpen);
  const playerStyle = useUi((s) => s.playerStyle);
  const setPlayerStyle = useUi((s) => s.setPlayerStyle);
  const timerPreset = useSleepTimer((s) => s.preset);
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? null);
  // The queue's entry for what's playing: the track menu needs the full track.
  const track = usePlayer((s) => {
    const entry = s.queue[s.index]?.track;
    return entry && entry.videoId === s.nowPlaying?.videoId ? entry : null;
  });
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayer.getState();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const isPanelOpen = sidePanel !== null;

  const styleClasses = {
    apple: 'h-(--player-pill-height) w-[min(840px,calc(100%-24px))] max-w-[840px] rounded-pill',
    compact: 'h-[52px] w-[min(680px,calc(100%-32px))] max-w-[680px] rounded-pill',
    dock: 'h-[62px] w-[min(1080px,calc(100%-8px))] max-w-[1080px] rounded-[18px] border border-white/15',
    neon: 'h-(--player-pill-height) w-[min(840px,calc(100%-24px))] max-w-[840px] rounded-pill border border-key/50 shadow-[0_0_28px_-4px_color-mix(in_srgb,var(--keyColor)_45%,transparent)]',
  }[playerStyle];

  return (
    // The side panel overlays the page; the pill re-centres on lg+ screens without crushing iPad Portrait.
    <div
      className="pointer-events-none absolute right-(--safe-right) bottom-[calc(var(--player-bottom-offset)+var(--safe-bottom))] left-[calc(var(--web-navigation-width)+var(--safe-left))] z-[calc(var(--z-web-chrome)-1)] flex justify-center px-4 transition-[padding-inline-end] duration-(--duration-panel) ease-panel lg:data-[panel-open=true]:pe-[calc(var(--side-panel-width)+20px)] max-md:hidden"
      data-panel-open={isPanelOpen}
    >
      <div
        className={`glass-pill group/pill pointer-events-auto relative grid grid-cols-[176px_minmax(120px,1fr)_auto] items-center overflow-hidden px-3.5 sm:px-4 max-lg:grid-cols-[auto_minmax(120px,1fr)_auto] max-lg:px-2.5 transition-[width,height,border-radius,box-shadow] duration-300 ${styleClasses}`}
        role="region"
        aria-label="Player"
      >
        <div className="flex shrink-0 items-center justify-between pr-2 max-lg:pr-1">
          <button className={`${toggle} max-lg:hidden`} aria-label="Shuffle" aria-pressed={shuffle} onClick={toggleShuffle}>
            <ShuffleIcon size={26} />
          </button>
          <div className="flex items-center gap-1 sm:gap-1.5 max-lg:gap-0.5">
            <button className={transport} disabled={!hasTrack} aria-label="Previous" onClick={previous}>
              <BackwardIcon size={24} />
            </button>
            <button className={transport} disabled={!hasTrack} aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
              {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
            </button>
            <button className={transport} disabled={!hasTrack} aria-label="Next" onClick={next}>
              <ForwardIcon size={24} />
            </button>
          </div>
          <button
            className={`${toggle} max-lg:hidden`}
            aria-label={repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat'}
            aria-pressed={repeat !== 'off'}
            onClick={cycleRepeat}
          >
            {repeat === 'one' ? <RepeatOneIcon size={26} /> : <RepeatIcon size={26} />}
          </button>
        </div>

        <div className="h-full min-w-0 flex-1 overflow-hidden px-2 sm:px-3">
          <Lcd />
        </div>

        <div
          className="group/actions relative flex shrink-0 items-center justify-end gap-[7px] sm:gap-[9px] max-lg:gap-1"
          data-volume-open={volumeOpen || undefined}
          onPointerLeave={() => setVolumeOpen(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setVolumeOpen(false);
          }}
        >
          <FavoriteButton videoId={videoId} className={`${fading} max-lg:hidden`} />
          {track && <TrackMenu track={track} className={`${fading} max-lg:hidden`} placement="above-end" />}

          {/* Quick Tools menu button: shown on compact/landscape or when side panel is open */}
          <div className={isPanelOpen ? 'flex' : 'flex xl:hidden'}>
            <QuickToolsMenu className={fading} />
          </div>

          {/* Direct tool buttons: shown on wide screens when side panel is closed */}
          <div className={isPanelOpen ? 'hidden' : 'hidden xl:flex items-center gap-[7px] sm:gap-[9px]'}>
            <button
              className={`${fading} relative`}
              aria-label="Sleep Timer"
              title="Sleep Timer"
              onClick={() => setSleepTimerOpen(true)}
            >
              <Moon size={16} />
              {timerPreset !== 'off' && (
                <span className="absolute top-1 right-0.5 size-1.5 rounded-full bg-key" />
              )}
            </button>
            <button
              className={fading}
              aria-label="Equalizer"
              title="Equalizer & Bass Boost"
              onClick={() => setEqualizerOpen(true)}
            >
              <Sliders size={16} />
            </button>
            <button
              className={fading}
              aria-label="Theme & Colors"
              title="Themes & Colors"
              onClick={() => setThemeModalOpen(true)}
            >
              <Palette size={16} />
            </button>
            <button
              className={fading}
              aria-label="Switch Player Style"
              title={`Player Style: ${PLAYER_STYLES.find((s) => s.id === playerStyle)?.label ?? playerStyle} (click to switch)`}
              aria-pressed={playerStyle !== 'apple'}
              onClick={() => {
                const idx = PLAYER_STYLES.findIndex((s) => s.id === playerStyle);
                setPlayerStyle(PLAYER_STYLES[(idx + 1) % PLAYER_STYLES.length]!.id);
              }}
            >
              <LayoutTemplate size={16} />
            </button>
            <button
              className={fading}
              aria-label="Mini Player"
              title="Floating Mini Player"
              aria-pressed={miniPlayerOpen}
              onClick={toggleMiniPlayer}
            >
              <PictureInPicture size={16} />
            </button>
          </div>

          {/* Always here: the panel itself says whether this track has lyrics, and from where. */}
          <button className={fading} aria-label="Lyrics" aria-pressed={sidePanel === 'lyrics'} onClick={() => toggleSidePanel('lyrics')}>
            {sidePanel === 'lyrics' ? <LyricsActiveIcon size={18} /> : <LyricsIcon size={18} />}
          </button>
          <button
            className={fading}
            aria-label="Up Next"
            aria-pressed={sidePanel === 'up-next'}
            onClick={() => toggleSidePanel('up-next')}
          >
            <UpNextIcon size={18} />
          </button>
          {!ios && <VolumeControl open={volumeOpen} onOpen={() => setVolumeOpen(true)} className={action} />}
        </div>
      </div>
    </div>
  );
}
