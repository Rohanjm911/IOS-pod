import { useEffect, useRef } from 'react';
import { getActiveAnalyser } from '@/playback/automix';
import { getMixBeat, getPlayhead, usePlayer } from '@/state/player';
import type { VisualizerMode } from '@/state/ui';

interface AudioVisualizerProps {
  mode?: VisualizerMode;
  className?: string;
  barCount?: number;
  interactive?: boolean;
}

export function AudioVisualizer({
  mode = 'bars',
  className = 'w-full h-24',
  barCount = 36,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);

    // Audio frequency buffer
    const freqBuffer = new Uint8Array(128);
    // Smooth interpolator for bars
    const smoothedValues = new Float32Array(barCount).fill(0);

    let phase = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(render);
      if (width === 0 || height === 0) return;

      const playerState = usePlayer.getState();
      const isPlaying = playerState.status === 'playing';
      const playhead = getPlayhead();
      const mixBeat = getMixBeat();

      // Read Web Audio Analyser if available
      const analyser = getActiveAnalyser();
      let hasRealAudio = false;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqBuffer);
        // Check if there is non-zero frequency data
        for (let i = 0; i < 32; i++) {
          if (freqBuffer[i]! > 8) {
            hasRealAudio = true;
            break;
          }
        }
      }

      phase += isPlaying ? 0.05 : 0.005;

      ctx.clearRect(0, 0, width, height);

      // Read active theme key-color or fallback
      const keyCol = getComputedStyle(canvas).getPropertyValue('--keyColor').trim() || '#fa2d48';

      // Dynamic reactive gradient with glowing white tip
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, `${keyCol}33`); // 20% alpha base
      grad.addColorStop(0.5, `${keyCol}d9`); // 85% alpha body
      grad.addColorStop(1, '#ffffff'); // pure white illuminated tip

      // Beat punch factor
      const beatPulse = mixBeat?.phase !== null && mixBeat?.phase !== undefined ? Math.sin(mixBeat.phase * Math.PI) * 0.25 : 0;
      const baseSec = playhead?.sec ?? 0;

      if (mode === 'bars') {
        const gap = 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          let targetNorm = 0;

          if (isPlaying) {
            if (hasRealAudio) {
              // Map index to frequency bin
              const binIndex = Math.min(freqBuffer.length - 1, Math.floor((i / barCount) * 48));
              targetNorm = (freqBuffer[binIndex]! / 255);
            } else {
              // Algorithmic rhythm synthesis
              const freqSin1 = Math.sin(baseSec * 4 + i * 0.35 + phase);
              const freqSin2 = Math.cos(baseSec * 7 - i * 0.45);
              const freqSin3 = Math.sin(phase * 1.5 + (i % 5) * 1.2);
              const harmonic = (freqSin1 * 0.5 + freqSin2 * 0.3 + freqSin3 * 0.2 + 1) / 2;
              targetNorm = Math.max(0.08, Math.min(0.95, harmonic + beatPulse));
            }
          } else {
            // Idle subtle decay
            targetNorm = 0.03;
          }

          // Smooth interpolation
          const prev = smoothedValues[i] ?? 0;
          const nextVal = prev + (targetNorm - prev) * 0.22;
          smoothedValues[i] = nextVal;
          const barHeight = Math.max(3, nextVal * (height - 6));
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = grad;
          ctx.beginPath();
          const r = Math.min(barWidth / 2, 4);
          ctx.roundRect(x, y, barWidth, barHeight, [r, r, 0, 0]);
          ctx.fill();

          // Highlight dot/cap on top of bar
          if (isPlaying && barHeight > 10) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, 2, [1, 1, 0, 0]);
            ctx.fill();
          }
        }
      } else if (mode === 'wave') {
        // Multi-layered flowing wave
        const layers = 3;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          ctx.moveTo(0, height / 2);

          const lPhase = phase * (l === 0 ? 1 : l === 1 ? -0.8 : 1.2) + l * 1.8;
          const amp = isPlaying ? (height * 0.35) * (1 - l * 0.2) + beatPulse * 15 : 4;

          for (let x = 0; x <= width; x += 4) {
            const progress = x / width;
            // Taper ends
            const windowEnvelope = Math.sin(progress * Math.PI);
            const freq = 0.015 + l * 0.008;
            const y = height / 2 + Math.sin(x * freq + lPhase) * Math.cos(x * 0.005 + lPhase * 0.5) * amp * windowEnvelope;
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = l === 0 ? 'rgba(250, 45, 72, 0.9)' : l === 1 ? 'rgba(168, 85, 247, 0.7)' : 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = l === 0 ? 2.5 : 1.5;
          ctx.stroke();
        }
      } else if (mode === 'particles') {
        // Bouncing particle grid / spectrum dots
        const dotCount = Math.min(barCount, 40);
        const step = width / dotCount;

        for (let i = 0; i < dotCount; i++) {
          let targetNorm = 0;
          if (isPlaying) {
            if (hasRealAudio) {
              const bin = Math.min(freqBuffer.length - 1, Math.floor((i / dotCount) * 40));
              targetNorm = freqBuffer[bin]! / 255;
            } else {
              targetNorm = (Math.sin(baseSec * 5 + i * 0.5) * 0.5 + 0.5) * 0.8 + beatPulse;
            }
          } else {
            targetNorm = 0.05;
          }

          const prev = smoothedValues[i] ?? 0;
          const nextVal = prev + (targetNorm - prev) * 0.25;
          smoothedValues[i] = nextVal;
          const cx = i * step + step / 2;
          const cy = height - nextVal * (height - 12) - 6;
          const radius = Math.max(2, nextVal * 6);

          ctx.fillStyle = isPlaying ? 'rgba(250, 45, 72, 0.95)' : 'rgba(255, 255, 255, 0.2)';
          ctx.shadowColor = 'rgba(250, 45, 72, 0.8)';
          ctx.shadowBlur = isPlaying ? 8 : 0;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Reset shadow
          ctx.shadowBlur = 0;
        }
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden && animationFrameId === 0) {
        render();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    render();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [mode, barCount]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`block select-none pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
