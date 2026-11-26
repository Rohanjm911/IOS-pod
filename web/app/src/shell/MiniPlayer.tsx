import {
  Maximize2,
  X,
  PictureInPicture,
  Minimize2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from '@/components/icons/Transport';
import { AudioVisualizer } from '@/components/music/AudioVisualizer';
import { sizedArtwork } from '@/lib/artwork';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { useScrubber } from './useScrubber';

export function MiniPlayer() {
  const miniPlayerOpen = useUi((s) => s.miniPlayerOpen);
  const setMiniPlayerOpen = useUi((s) => s.setMiniPlayerOpen);
  const setFullScreen = useUi((s) => s.setFullScreen);

  const nowPlaying = usePlayer((s) => s.nowPlaying);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const hasTrack = nowPlaying !== null;
  const { togglePlay, next, previous } = usePlayer.getState();

  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 84 }); // Offset from bottom-right
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const { bar, elapsed, remaining, handlers } = useScrubber();

  // Dragging logic
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or non-interactive parts
    if ((e.target as HTMLElement).closest('button, input, a, [role="slider"]')) return;
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = dragStart.current.mouseX - e.clientX;
    const dy = dragStart.current.mouseY - e.clientY;

    const newX = Math.max(12, Math.min(window.innerWidth - 320, dragStart.current.startX + dx));
    const newY = Math.max(12, Math.min(window.innerHeight - 140, dragStart.current.startY + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Browser Native Picture-in-Picture
  const toggleNativePip = async () => {
    try {
      const activeVideo = document.querySelector('video') as HTMLVideoElement | null;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (activeVideo) {
        await activeVideo.requestPictureInPicture();
      } else {
        // Audio only: Canvas capture stream fallback for PiP
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx && nowPlaying?.artworkUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = sizedArtwork(nowPlaying.artworkUrl, 400);
          img.onload = async () => {
            ctx.drawImage(img, 0, 0, 400, 400);
            const stream = canvas.captureStream();
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = stream;
            tempVideo.muted = true;
            await tempVideo.play();
            await tempVideo.requestPictureInPicture();
          };
        }
      }
    } catch (err) {
      console.warn('PiP not supported or cancelled:', err);
    }
  };

  if (!miniPlayerOpen || !hasTrack) return null;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        right: `${pos.x}px`,
        bottom: `${pos.y}px`,
      }}
      className="fixed z-(--z-modal) select-none cursor-grab active:cursor-grabbing animate-zoom rounded-[20px] bg-thick-material shadow-[0_12px_44px_rgba(0,0,0,0.55),0_0_0_0.5px_var(--vibrantDivider)] [backdrop-filter:saturate(2.2)_blur(32px)] border border-white/10 overflow-hidden w-[340px] text-primary"
      role="region"
      aria-label="Floating Mini Player"
    >
      {/* Top Bar with actions */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-key animate-pulse" />
          <span className="type-caption-2 uppercase tracking-wider font-semibold text-secondary">
            Mini Player
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleNativePip}
            className="grid size-6 place-items-center rounded-full text-secondary hover:text-primary hover:bg-white/10 transition-colors"
            title="Picture in Picture"
            aria-label="Picture in Picture"
          >
            <PictureInPicture size={13} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="grid size-6 place-items-center rounded-full text-secondary hover:text-primary hover:bg-white/10 transition-colors"
            title={expanded ? 'Compact mode' : 'Expand artwork'}
            aria-label="Toggle size"
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={() => {
              setMiniPlayerOpen(false);
              setFullScreen(true);
            }}
            className="grid size-6 place-items-center rounded-full text-secondary hover:text-primary hover:bg-white/10 transition-colors"
            title="Full Screen Player"
            aria-label="Full Screen Player"
          >
            <Maximize2 size={14} className="rotate-45" />
          </button>
          <button
            onClick={() => setMiniPlayerOpen(false)}
            className="grid size-6 place-items-center rounded-full text-secondary hover:text-primary hover:bg-white/10 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3.5 pb-3">
        {expanded && (
          <div className="relative mb-3 aspect-square w-full rounded-[12px] overflow-hidden shadow-lg mt-1">
            {nowPlaying.artworkUrl && (
              <img
                src={sizedArtwork(nowPlaying.artworkUrl, 400)}
                alt=""
                className="size-full object-cover"
                decoding="async"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2.5">
              <AudioVisualizer mode="wave" className="w-full h-8" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="relative size-12 shrink-0 rounded-[8px] overflow-hidden shadow-md">
              {nowPlaying.artworkUrl && (
                <img
                  src={sizedArtwork(nowPlaying.artworkUrl, 100)}
                  alt=""
                  className="size-full object-cover"
                  decoding="async"
                />
              )}
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="truncate type-body-emphasized text-primary">
              {nowPlaying.title}
            </span>
            <span className="truncate type-caption-2 text-secondary">
              {nowPlaying.artist}
            </span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={previous}
              disabled={!hasTrack}
              className="grid size-7 place-items-center rounded-full text-secondary hover:text-primary transition-colors disabled:opacity-40"
              aria-label="Previous"
            >
              <BackwardIcon size={20} />
            </button>
            <button
              onClick={togglePlay}
              disabled={!hasTrack}
              className="grid size-8 place-items-center rounded-full bg-key text-white shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>
            <button
              onClick={next}
              disabled={!hasTrack}
              className="grid size-7 place-items-center rounded-full text-secondary hover:text-primary transition-colors disabled:opacity-40"
              aria-label="Next"
            >
              <ForwardIcon size={20} />
            </button>
          </div>
        </div>

        {/* Scrubber */}
        <div className="mt-2.5">
          <div className="group/hit flex h-3 cursor-pointer touch-none items-center" {...handlers}>
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15" aria-hidden="true">
              <div
                ref={bar}
                className="relative size-full origin-left scale-x-(--progress) bg-key [--progress:0]"
              />
            </div>
          </div>
          <div className="flex justify-between type-[500_10px/12px] tabular-nums text-tertiary mt-0.5">
            <span ref={elapsed}>0:00</span>
            <span ref={remaining}>0:00</span>
          </div>
        </div>

        {!expanded && (
          <div className="mt-1 h-3 overflow-hidden rounded-full opacity-60">
            <AudioVisualizer mode="bars" barCount={24} className="w-full h-3" />
          </div>
        )}
      </div>
    </div>
  );
}
