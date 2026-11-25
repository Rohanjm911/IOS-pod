import { useEffect, useRef } from 'react';
import { ForwardIcon, PauseIcon, PlayIcon } from '@/components/icons/Transport';
import { LogoMark } from '@/components/icons/LogoMark';
import { VideoSurface } from '@/components/music/VideoSurface';
import { sizedArtwork } from '@/lib/artwork';
import { getPlayhead, usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { useHasVideo } from '@/state/video';

/**
 * Floating iPhone / compact-iPad Split-View mini-player pill (< 768px),
 * positioned safely above the iOS home indicator.
 */
export function MobilePlayerBar() {
  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const status = usePlayer((s) => s.status);
  const playing = status === 'playing' || status === 'buffering';
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat !== 'off' || (s.autoplay && s.index >= 0));
  const { togglePlay, next } = usePlayer.getState();
  const setFullScreen = useUi((s) => s.setFullScreen);
  const video = useHasVideo(nowPlaying?.videoId);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = barRef.current;
      const head = getPlayhead();
      const dur = nowPlaying?.durationSec ?? 0;
      if (el) {
        const ratio = head && dur > 0 ? Math.max(0, Math.min(1, head.sec / dur)) : 0;
        el.style.transform = `scaleX(${ratio})`;
      }
      if (playing) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [nowPlaying?.videoId, nowPlaying?.durationSec, playing, status]);

  if (!nowPlaying) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--mobile-tab-bar-height)+var(--safe-bottom)+8px)] z-[calc(var(--z-web-chrome)-1)] hidden px-3 max-md:flex max-md:justify-center"
      style={{
        paddingLeft: 'max(12px, var(--safe-left))',
        paddingRight: 'max(12px, var(--safe-right))',
      }}
    >
      <div
        className="glass-pill pointer-events-auto relative flex h-(--mini-player-height) w-full max-w-[540px] items-center gap-2.5 overflow-hidden rounded-[16px] pr-1.5 pl-2.5"
        role="region"
        aria-label="Player"
      >
        <button
          className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
          aria-label={`Open full screen player for ${nowPlaying.title}`}
          onClick={() => setFullScreen(true)}
        >
          <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[7px] bg-joe">
            {nowPlaying.artworkUrl ? (
              <img
                src={sizedArtwork(nowPlaying.artworkUrl, 80)}
                alt=""
                referrerPolicy="no-referrer"
                decoding="async"
                className="size-full object-cover"
              />
            ) : (
              <LogoMark size={20} className="text-tertiary" />
            )}
            {video && <VideoSurface className="absolute inset-0" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate type-body-emphasized text-primary">{nowPlaying.title || 'Loading…'}</span>
            <span className="truncate type-callout text-secondary">
              {status === 'error' ? usePlayer.getState().error : nowPlaying.artist || (status === 'loading' ? 'Loading…' : '')}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <button
            className="grid size-11 place-items-center rounded-full text-primary active:scale-90"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={togglePlay}
          >
            {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
          </button>
          <button
            className="grid size-11 place-items-center rounded-full text-primary active:scale-90 disabled:opacity-40"
            aria-label="Next"
            disabled={!hasNext}
            onClick={next}
          >
            <ForwardIcon size={24} />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-0 h-[2px] overflow-hidden rounded-full bg-quaternary" aria-hidden="true">
          <div ref={barRef} className="size-full origin-left bg-secondary" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}
