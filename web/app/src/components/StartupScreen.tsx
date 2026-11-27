import { useEffect, useState, type CSSProperties } from 'react';
import { LogoMark } from '@/components/icons/LogoMark';
import { useUi, type AppUiMode } from '@/state/ui';

const EQ_BARS = [
  { delay: '0ms', height: '18px', color: '#E50914' },
  { delay: '140ms', height: '28px', color: '#FF2D55' },
  { delay: '280ms', height: '22px', color: '#7C3AED' },
  { delay: '100ms', height: '30px', color: '#00F2FE' },
  { delay: '220ms', height: '16px', color: '#FBBF24' },
];

/** Multi-color vertical light ribbons inspired by the Netflix spectrum burst. */
const RIBBONS = [
  { color: '#E50914', width: '10px', delay: '680ms', rxMid: '-28px', rxEnd: '-360px' },
  { color: '#FF2D55', width: '14px', delay: '710ms', rxMid: '-18px', rxEnd: '-240px' },
  { color: '#FB923C', width: '8px', delay: '740ms', rxMid: '-10px', rxEnd: '-140px' },
  { color: '#FBBF24', width: '12px', delay: '720ms', rxMid: '-4px', rxEnd: '-55px' },
  { color: '#10B981', width: '10px', delay: '700ms', rxMid: '4px', rxEnd: '55px' },
  { color: '#00F2FE', width: '14px', delay: '730ms', rxMid: '12px', rxEnd: '150px' },
  { color: '#007AFF', width: '12px', delay: '690ms', rxMid: '22px', rxEnd: '250px' },
  { color: '#7C3AED', width: '16px', delay: '750ms', rxMid: '34px', rxEnd: '370px' },
  { color: '#FA2D48', width: '9px', delay: '770ms', rxMid: '-40px', rxEnd: '-460px' },
  { color: '#38BDF8', width: '11px', delay: '760ms', rxMid: '42px', rxEnd: '460px' },
];

/**
 * Synthesizes a theme-matched startup sound exclusively for the active UI style
 * using a self-contained disposable AudioContext.
 */
function playStartupSound(
  uiMode: AppUiMode,
  onBlocked?: (blocked: boolean) => void,
): {
  cleanup: () => void;
  unlock: () => boolean;
} {
  const noop = { cleanup: () => {}, unlock: () => false };
  if (typeof window === 'undefined') return noop;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return noop;

  let ctx: AudioContext | null = null;
  let played = false;
  let closeTimer = 0;
  let blockedTimer = 0;

  const trigger = () => {
    if (played || !ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (!played && ctx?.state === 'running') scheduleNotes(ctx);
      });
      return false;
    }
    if (ctx.state === 'running') {
      scheduleNotes(ctx);
      return true;
    }
    return false;
  };

  const scheduleNotes = (audioCtx: AudioContext) => {
    if (played) return;
    played = true;
    window.clearTimeout(blockedTimer);
    onBlocked?.(false);
    const now = audioCtx.currentTime;

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(12, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.004, now);
    compressor.release.setValueAtTime(0.25, now);

    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.38, now + 0.03);
    master.gain.setValueAtTime(0.38, now + 1.35);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);

    const reverbDelay = audioCtx.createDelay(0.5);
    reverbDelay.delayTime.setValueAtTime(uiMode === 'secondary' ? 0.09 : uiMode === 'bento' ? 0.18 : 0.14, now);
    const reverbFilter = audioCtx.createBiquadFilter();
    reverbFilter.type = 'lowpass';
    reverbFilter.frequency.setValueAtTime(uiMode === 'bento' ? 2800 : 1900, now);
    const reverbFeedback = audioCtx.createGain();
    reverbFeedback.gain.setValueAtTime(uiMode === 'secondary' ? 0.24 : 0.34, now);
    const reverbWet = audioCtx.createGain();
    reverbWet.gain.setValueAtTime(uiMode === 'bento' ? 0.36 : 0.3, now);

    compressor.connect(master);
    compressor.connect(reverbDelay);
    reverbDelay.connect(reverbFilter);
    reverbFilter.connect(reverbFeedback);
    reverbFeedback.connect(reverbDelay);
    reverbFilter.connect(reverbWet);
    reverbWet.connect(master);
    master.connect(audioCtx.destination);

    if (uiMode === 'secondary') {
      // Neo-Brutalism: punchy square sub-stomp + crunchy dual-tone power chord
      const stomp = audioCtx.createOscillator();
      const stompGain = audioCtx.createGain();
      stomp.type = 'square';
      stomp.frequency.setValueAtTime(165, now + 0.04);
      stomp.frequency.exponentialRampToValueAtTime(42, now + 0.32);
      stompGain.gain.setValueAtTime(0.0001, now + 0.04);
      stompGain.gain.exponentialRampToValueAtTime(0.65, now + 0.055);
      stompGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      stomp.connect(stompGain).connect(compressor);
      stomp.start(now + 0.04);
      stomp.stop(now + 0.45);

      const synthFilter = audioCtx.createBiquadFilter();
      synthFilter.type = 'lowpass';
      synthFilter.Q.setValueAtTime(4.0, now + 0.24);
      synthFilter.frequency.setValueAtTime(420, now + 0.24);
      synthFilter.frequency.exponentialRampToValueAtTime(2800, now + 0.55);
      synthFilter.frequency.exponentialRampToValueAtTime(700, now + 1.9);
      synthFilter.connect(compressor);

      for (const freq of [65.41, 98.0, 130.81, 155.56, 196.0]) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + 0.24);
        g.gain.setValueAtTime(0.0001, now + 0.24);
        g.gain.exponentialRampToValueAtTime(0.18, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);
        osc.connect(g).connect(synthFilter);
        osc.start(now + 0.24);
        osc.stop(now + 2.0);
      }
    } else if (uiMode === 'editorial') {
      // Editorial Magazine: crisp typewriter key clicks + warm Rhodes/piano Fmaj9 bloom
      for (const clickAt of [0.04, 0.12, 0.2]) {
        try {
          const len = Math.floor(audioCtx.sampleRate * 0.025);
          const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2200, now + clickAt);
          bp.Q.setValueAtTime(3.0, now + clickAt);
          const cg = audioCtx.createGain();
          cg.gain.setValueAtTime(0.35, now + clickAt);
          src.connect(bp).connect(cg).connect(compressor);
          src.start(now + clickAt);
        } catch {
          // ignore
        }
      }

      const warmFilter = audioCtx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.setValueAtTime(1500, now + 0.28);
      warmFilter.connect(compressor);

      const fmaj9 = [174.61, 261.63, 329.63, 392.0, 440.0];
      fmaj9.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const t = now + 0.28 + idx * 0.055;
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(g).connect(warmFilter);
        osc.start(t);
        osc.stop(now + 2.25);
      });
    } else if (uiMode === 'bento') {
      // Bento Grids: Apple-inspired crystalline harmonic chime arpeggio
      const chimeNotes = [261.63, 329.63, 392.0, 493.88, 587.33]; // Cmaj9
      chimeNotes.forEach((freq, idx) => {
        const t = now + 0.06 + idx * 0.08;
        const osc = audioCtx.createOscillator();
        const shimmer = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        shimmer.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        shimmer.frequency.setValueAtTime(freq * 2, t);
        const sg = audioCtx.createGain();
        sg.gain.setValueAtTime(0.04, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.24, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(g).connect(compressor);
        shimmer.connect(sg).connect(g);
        osc.start(t);
        shimmer.start(t);
        osc.stop(now + 2.25);
        shimmer.stop(now + 2.25);
      });
    } else {
      // Primary (Glassmorphism): Cinema "Ta-Dum" sub-drop + orchestral synth brass swell
      try {
        const bufSize = Math.floor(audioCtx.sampleRate * 0.35);
        const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuf;
        const riserFilter = audioCtx.createBiquadFilter();
        riserFilter.type = 'bandpass';
        riserFilter.Q.setValueAtTime(2.2, now);
        riserFilter.frequency.setValueAtTime(180, now);
        riserFilter.frequency.exponentialRampToValueAtTime(2600, now + 0.3);
        const riserGain = audioCtx.createGain();
        riserGain.gain.setValueAtTime(0.001, now);
        riserGain.gain.exponentialRampToValueAtTime(0.22, now + 0.26);
        riserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
        noise.connect(riserFilter).connect(riserGain).connect(compressor);
        noise.start(now);
        noise.stop(now + 0.35);
      } catch {
        // ignore noise buffer errors in restricted environments
      }

      const taOsc = audioCtx.createOscillator();
      const taGain = audioCtx.createGain();
      taOsc.type = 'sine';
      taOsc.frequency.setValueAtTime(140, now + 0.05);
      taOsc.frequency.exponentialRampToValueAtTime(52, now + 0.24);
      taGain.gain.setValueAtTime(0.0001, now + 0.05);
      taGain.gain.exponentialRampToValueAtTime(0.85, now + 0.065);
      taGain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
      taOsc.connect(taGain).connect(compressor);
      taOsc.start(now + 0.05);
      taOsc.stop(now + 0.29);

      const dumSub = audioCtx.createOscillator();
      const dumSubGain = audioCtx.createGain();
      dumSub.type = 'sine';
      dumSub.frequency.setValueAtTime(94, now + 0.29);
      dumSub.frequency.exponentialRampToValueAtTime(38, now + 1.4);
      dumSubGain.gain.setValueAtTime(0.0001, now + 0.29);
      dumSubGain.gain.exponentialRampToValueAtTime(1.0, now + 0.32);
      dumSubGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.05);
      dumSub.connect(dumSubGain).connect(compressor);
      dumSub.start(now + 0.29);
      dumSub.stop(now + 2.1);

      const dumGrit = audioCtx.createOscillator();
      const dumGritFilter = audioCtx.createBiquadFilter();
      const dumGritGain = audioCtx.createGain();
      dumGrit.type = 'sawtooth';
      dumGrit.frequency.setValueAtTime(94, now + 0.29);
      dumGrit.frequency.exponentialRampToValueAtTime(38, now + 1.2);
      dumGritFilter.type = 'lowpass';
      dumGritFilter.Q.setValueAtTime(3.0, now + 0.29);
      dumGritFilter.frequency.setValueAtTime(680, now + 0.29);
      dumGritFilter.frequency.exponentialRampToValueAtTime(90, now + 1.3);
      dumGritGain.gain.setValueAtTime(0.0001, now + 0.29);
      dumGritGain.gain.exponentialRampToValueAtTime(0.45, now + 0.32);
      dumGritGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
      dumGrit.connect(dumGritFilter).connect(dumGritGain).connect(compressor);
      dumGrit.start(now + 0.29);
      dumGrit.stop(now + 1.7);

      const brassBus = audioCtx.createBiquadFilter();
      brassBus.type = 'lowpass';
      brassBus.Q.setValueAtTime(1.4, now + 0.32);
      brassBus.frequency.setValueAtTime(240, now + 0.32);
      brassBus.frequency.exponentialRampToValueAtTime(3400, now + 0.95);
      brassBus.frequency.exponentialRampToValueAtTime(900, now + 2.15);
      brassBus.connect(compressor);

      const chordVoices: Array<{ freq: number; detune: number; level: number }> = [
        { freq: 65.41, detune: -5, level: 0.2 },
        { freq: 98.0, detune: 5, level: 0.16 },
        { freq: 130.81, detune: -6, level: 0.18 },
        { freq: 196.0, detune: 6, level: 0.14 },
        { freq: 293.66, detune: -4, level: 0.12 },
        { freq: 329.63, detune: 4, level: 0.12 },
      ];
      for (const v of chordVoices) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(v.freq, now + 0.32);
        osc.detune.setValueAtTime(v.detune, now + 0.32);
        gain.gain.setValueAtTime(0.0001, now + 0.32);
        gain.gain.exponentialRampToValueAtTime(v.level, now + 0.72);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(gain).connect(brassBus);
        osc.start(now + 0.32);
        osc.stop(now + 2.25);
      }
    }

    closeTimer = window.setTimeout(() => {
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    }, 2450);
  };

  try {
    ctx = new AudioCtx();
    trigger();
    blockedTimer = window.setTimeout(() => {
      if (!played && ctx && ctx.state === 'suspended') {
        onBlocked?.(true);
      }
    }, 120);
  } catch {
    return noop;
  }

  // If browser blocked autoplay before gesture, unlock cleanly on first interaction while splash is up
  const onGesture = () => {
    trigger();
  };
  window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
  window.addEventListener('keydown', onGesture, { once: true, passive: true });

  return {
    unlock: () => {
      const wasBlocked = !played;
      trigger();
      return wasBlocked;
    },
    cleanup: () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      window.clearTimeout(blockedTimer);
      // Let closeTimer finish closing AudioContext naturally if the chord already started playing
      if (!played) {
        window.clearTimeout(closeTimer);
        if (ctx && ctx.state !== 'closed') {
          void ctx.close().catch(() => {});
        }
        ctx = null;
      }
    },
  };
}

/**
 * Cinematic Netflix-inspired multi-color startup splash screen.
 * Opens on pitch-black with spring-scaled LogoMark, then erupts into multi-color
 * vertical spectrum ribbons & smooth zoom-through transition into the app.
 */
export function StartupScreen() {
  const uiMode = useUi((s) => s.uiMode);
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'gone'>('visible');
  const [soundBlocked, setSoundBlocked] = useState(false);
  const soundCtrlRef = useState<{ unlock: () => boolean }>({ unlock: () => false })[0];

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const exitDelay = reduced ? 350 : 1900;
    const unmountDelay = reduced ? 650 : 2400;

    const ctrl = reduced ? { cleanup: () => {}, unlock: () => false } : playStartupSound(uiMode, setSoundBlocked);
    soundCtrlRef.unlock = ctrl.unlock;
    const t1 = window.setTimeout(() => setPhase('exiting'), exitDelay);
    const t2 = window.setTimeout(() => setPhase('gone'), unmountDelay);
    return () => {
      ctrl.cleanup();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [soundCtrlRef, uiMode]);

  if (phase === 'gone') return null;

  const exiting = phase === 'exiting';
  const handleBackdropClick = () => {
    if (soundBlocked) {
      soundCtrlRef.unlock();
      setSoundBlocked(false);
      return;
    }
    setPhase('exiting');
  };

  // 4th UI: Apple-Inspired Bento Grids Startup Screen (staggered modular rounded tiles)
  if (uiMode === 'bento') {
    return (
      <div
        role="status"
        aria-label="Loading ISO pod"
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-4 transition-[opacity,transform] duration-500 ${
          exiting ? 'pointer-events-none scale-[1.03] opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          backgroundColor: 'var(--bento-canvas, #f5f5f7)',
          color: 'var(--bento-ink, #1d1d1f)',
        }}
      >
        <div className="grid w-[min(560px,92vw)] grid-cols-4 grid-rows-2 gap-3 max-sm:grid-cols-2">
          {/* 2x2 Feature Gradient Tile */}
          <div
            className="col-span-2 row-span-2 flex flex-col justify-between rounded-[24px] p-6 text-white shadow-[0_12px_32px_rgba(124,58,237,0.3)] animate-[bento-reveal_500ms_ease-out_both]"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
          >
            <LogoMark size={52} />
            <div>
              <h1 className="text-[32px] font-bold tracking-tight leading-none">ISO pod</h1>
              <p className="mt-1.5 text-xs font-medium text-white/80">Pure Sound. Pocket Hi-Fi.</p>
            </div>
          </div>

          {/* Blue Accent Tile */}
          <div
            className="col-span-2 flex flex-col justify-between rounded-[24px] p-5 text-white shadow-sm animate-[bento-reveal_500ms_ease-out_80ms_both]"
            style={{ backgroundColor: '#0066CC' }}
          >
            <span className="text-[11px] font-semibold tracking-wider uppercase text-white/75">Multi-Source</span>
            <span className="text-lg font-semibold leading-tight">Audius &bull; iTunes &bull; YTM</span>
          </div>

          {/* Green Tile */}
          <div
            className="flex flex-col justify-between rounded-[24px] p-4 text-[#1D1D1F] shadow-sm animate-[bento-reveal_500ms_ease-out_160ms_both]"
            style={{ backgroundColor: '#34C759' }}
          >
            <span className="text-[10px] font-bold uppercase opacity-75">DSP</span>
            <span className="text-sm font-bold leading-tight">10-Band EQ</span>
          </div>

          {/* Dark / Tile Card */}
          <div
            className="flex flex-col justify-between rounded-[24px] p-4 text-white shadow-sm animate-[bento-reveal_500ms_ease-out_240ms_both]"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            <span className="text-[10px] font-bold uppercase text-white/60">Hi-Fi</span>
            <span className="text-sm font-bold leading-tight">Lossless UI</span>
          </div>
        </div>

        {soundBlocked && (
          <div className="pointer-events-none mt-6 rounded-full bg-[#0066CC] px-4 py-1.5 text-[11px] font-semibold tracking-wider text-white uppercase shadow-md animate-pulse">
            Tap anywhere for Cinema Sound
          </div>
        )}
      </div>
    );
  }

  // 3rd UI: Editorial Grid / Magazine Startup Screen (serif headlines + rising print layout)
  if (uiMode === 'editorial') {
    return (
      <div
        role="status"
        aria-label="Loading ISO pod"
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-6 transition-opacity duration-500 ${
          exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundColor: 'var(--ed-paper, #ffffff)',
          color: 'var(--ed-ink, #000000)',
        }}
      >
        <div className="flex w-[min(540px,92vw)] flex-col">
          <span
            className="text-[11px] font-bold tracking-[0.22em] uppercase animate-[editorial-rise_500ms_ease-out_both]"
            style={{ color: 'var(--ed-accent, #dc2626)' }}
          >
            Issue No. 01 &bull; Pure Sound &bull; Pocket Hi-Fi
          </span>

          <div
            className="my-4 h-[2px] w-full origin-left animate-[editorial-rule_650ms_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ backgroundColor: 'var(--ed-ink, #000000)' }}
          />

          <div className="flex items-center justify-between gap-5 py-2 animate-[editorial-rise_650ms_cubic-bezier(0.22,1,0.36,1)_120ms_both]">
            <h1
              className="text-[48px] sm:text-[60px] font-black leading-[1.02] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--ed-display, "Playfair Display", Georgia, serif)' }}
            >
              ISO pod
            </h1>
            <LogoMark size={58} />
          </div>

          <p
            className="mt-2 font-serif text-sm italic animate-[editorial-rise_650ms_cubic-bezier(0.22,1,0.36,1)_220ms_both]"
            style={{ color: 'var(--ed-muted, #6b7280)' }}
          >
            &ldquo;Unlimited playlist curation &amp; multi-source hi-fi streaming, typeset for the modern listener.&rdquo;
          </p>

          <div
            className="mt-5 h-[2px] w-full origin-left animate-[editorial-rule_1.4s_cubic-bezier(0.22,1,0.36,1)_180ms_both]"
            style={{ backgroundColor: 'var(--ed-accent, #dc2626)' }}
          />
        </div>

        {soundBlocked && (
          <div
            className="pointer-events-none absolute bottom-10 z-20 border px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase"
            style={{
              backgroundColor: 'var(--ed-paper, #ffffff)',
              color: 'var(--ed-accent, #dc2626)',
              borderColor: 'var(--ed-ink, #000000)',
            }}
          >
            Tap anywhere for Cinema Sound
          </div>
        )}
      </div>
    );
  }

  // Secondary UI: Neo-Brutalism Dual-Tone Startup Screen with hard-slam & stomp animations
  if (uiMode === 'secondary') {
    return (
      <div
        role="status"
        aria-label="Loading ISO pod"
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden transition-[opacity,transform] duration-400 ease-out ${
          exiting ? 'pointer-events-none translate-y-[-12px] scale-[0.97] opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          backgroundColor: 'var(--brutal-bg, #f5f2eb)',
          backgroundImage:
            'radial-gradient(color-mix(in srgb, var(--brutal-ink, #0b0b0d) 16%, transparent) 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
          color: 'var(--brutal-ink, #0b0b0d)',
        }}
      >
        {/* Top & Bottom Neo-Brutalism Marquee Strips */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 inset-x-0 overflow-hidden border-b-[3px] py-1.5 text-[11px] font-black tracking-[0.22em] uppercase"
          style={{
            backgroundColor: 'var(--brutal-accent, #d9ff00)',
            color: 'var(--brutal-accent-ink, #0b0b0d)',
            borderColor: 'var(--brutal-ink, #0b0b0d)',
          }}
        >
          <div className="flex w-max whitespace-nowrap animate-[brutal-marquee_10s_linear_infinite]">
            <span className="px-4">ISO POD // PURE SOUND // POCKET HI-FI // NEO-BRUTALISM //</span>
            <span className="px-4">ISO POD // PURE SOUND // POCKET HI-FI // NEO-BRUTALISM //</span>
            <span className="px-4">ISO POD // PURE SOUND // POCKET HI-FI // NEO-BRUTALISM //</span>
            <span className="px-4">ISO POD // PURE SOUND // POCKET HI-FI // NEO-BRUTALISM //</span>
          </div>
        </div>

        {/* Center Hard-Slam Poster Card */}
        <div
          className="relative z-10 mx-4 flex w-[min(390px,90vw)] flex-col items-center rounded-[14px] border-[3px] px-7 py-8 animate-[brutal-slam_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
          style={{
            backgroundColor: 'var(--brutal-surface, #ffffff)',
            borderColor: 'var(--brutal-ink, #0b0b0d)',
            boxShadow: '10px 10px 0 var(--brutal-ink, #0b0b0d)',
          }}
        >
          <div
            className="grid size-24 place-items-center rounded-[12px] border-[3px] animate-[brutal-badge-pop_560ms_cubic-bezier(0.22,1,0.36,1)_120ms_both]"
            style={{
              backgroundColor: 'var(--brutal-accent, #d9ff00)',
              borderColor: 'var(--brutal-ink, #0b0b0d)',
              boxShadow: '5px 5px 0 var(--brutal-ink, #0b0b0d)',
            }}
          >
            <LogoMark size={76} />
          </div>

          <h1 className="mt-6 text-[36px] font-black tracking-tight uppercase leading-none">
            ISO{' '}
            <span
              className="inline-block rounded-[6px] border-2 px-2 py-0.5"
              style={{
                backgroundColor: 'var(--brutal-accent-2, #ff3d00)',
                color: 'var(--brutal-accent-2-ink, #ffffff)',
                borderColor: 'var(--brutal-ink, #0b0b0d)',
                boxShadow: '3px 3px 0 var(--brutal-ink, #0b0b0d)',
              }}
            >
              pod
            </span>
          </h1>

          <p
            className="mt-3 rounded-full border-2 px-3 py-0.5 text-[10px] font-extrabold tracking-[0.2em] uppercase"
            style={{
              backgroundColor: 'var(--brutal-bg, #f5f2eb)',
              borderColor: 'var(--brutal-ink, #0b0b0d)',
            }}
          >
            Pure Sound &bull; Pocket Hi-Fi
          </p>

          {/* 5 Chunky Dual-Tone Stomp Bars */}
          <div aria-hidden="true" className="mt-6 flex h-8 items-end gap-2">
            {EQ_BARS.map((bar, i) => (
              <span
                key={i}
                className="w-3 origin-bottom rounded-[3px] border-2 animate-[brutal-bar-stomp_520ms_steps(4,end)_infinite_alternate]"
                style={{
                  height: bar.height,
                  backgroundColor: i % 2 === 0 ? 'var(--brutal-accent, #d9ff00)' : 'var(--brutal-accent-2, #ff3d00)',
                  borderColor: 'var(--brutal-ink, #0b0b0d)',
                  boxShadow: '2px 2px 0 var(--brutal-ink, #0b0b0d)',
                  animationDelay: bar.delay,
                }}
              />
            ))}
          </div>
        </div>

        {soundBlocked && (
          <div
            className="pointer-events-none absolute bottom-12 z-20 rounded-[8px] border-2 px-4 py-1.5 text-[11px] font-extrabold tracking-wider uppercase"
            style={{
              backgroundColor: 'var(--brutal-accent-2, #ff3d00)',
              color: 'var(--brutal-accent-2-ink, #ffffff)',
              borderColor: 'var(--brutal-ink, #0b0b0d)',
              boxShadow: '4px 4px 0 var(--brutal-ink, #0b0b0d)',
            }}
          >
            Tap anywhere for Cinema Sound
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading ISO pod"
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-black transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[1.08] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      {/* Multi-color ambient cinema glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute size-[min(86vw,500px)] rounded-full bg-[conic-gradient(from_0deg,#E50914,#FF2D55,#7C3AED,#00F2FE,#10B981,#FBBF24,#E50914)] opacity-25 blur-[110px] animate-[startup-glow_2.2s_ease-in-out_infinite_alternate]"
      />

      {/* Netflix-style multi-color vertical spectrum ribbon burst */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        {RIBBONS.map((r, i) => (
          <span
            key={i}
            className="absolute h-[75vh] origin-center rounded-full blur-[1px] animate-[netflix-ribbon_1.35s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={
              {
                width: r.width,
                background: `linear-gradient(to bottom, transparent 0%, ${r.color} 28%, #ffffff 50%, ${r.color} 72%, transparent 100%)`,
                boxShadow: `0 0 24px ${r.color}`,
                animationDelay: r.delay,
                '--rx-mid': r.rxMid,
                '--rx-end': r.rxEnd,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Center Zoom Stage */}
      <div className="relative z-10 flex flex-col items-center animate-[netflix-zoom_2.3s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-36 rounded-full border border-[#E50914]/45 animate-[startup-ring_1.7s_cubic-bezier(0.16,1,0.3,1)_infinite]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-36 rounded-full border border-[#00F2FE]/35 animate-[startup-ring_1.7s_cubic-bezier(0.16,1,0.3,1)_420ms_infinite]"
          />

          {/* Glass icon badge with multi-color rim + diagonal sheen */}
          <div className="relative grid size-26 place-items-center overflow-hidden rounded-full border border-white/20 bg-black/80 shadow-[0_0_50px_-6px_rgba(229,9,20,0.65),0_0_80px_-10px_rgba(124,58,237,0.5)] backdrop-blur-2xl animate-[startup-logo_650ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[startup-sheen_1.1s_ease-in-out_250ms_1_forwards]"
            />
            <LogoMark
              size={88}
              className="relative drop-shadow-[0_0_18px_rgba(229,9,20,0.7)]"
            />
          </div>
        </div>

        {/* Multi-color gradient brand wordmark */}
        <div className="mt-7 flex flex-col items-center gap-1.5 text-center animate-[startup-text_650ms_cubic-bezier(0.16,1,0.3,1)_160ms_both]">
          <h1 className="text-[34px] font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(229,9,20,0.45)]">
            ISO{' '}
            <span className="bg-gradient-to-r from-[#E50914] via-[#FF2D55] via-[#A855F7] to-[#00F2FE] bg-clip-text text-transparent">
              pod
            </span>
          </h1>
          <p className="type-caption-1 tracking-[0.26em] text-white/70 uppercase">
            Pure Sound &bull; Pocket Hi-Fi
          </p>
        </div>

        {/* 5-bar multi-color animated equalizer */}
        <div
          aria-hidden="true"
          className="mt-7 flex h-8 items-end gap-1.5 animate-[startup-text_600ms_cubic-bezier(0.16,1,0.3,1)_260ms_both]"
        >
          {EQ_BARS.map((bar, i) => (
            <span
              key={i}
              className="w-1.5 origin-bottom rounded-full animate-[startup-eq_700ms_ease-in-out_infinite_alternate]"
              style={{
                height: bar.height,
                background: `linear-gradient(to top, ${bar.color}, #ffffff)`,
                boxShadow: `0 0 10px ${bar.color}`,
                animationDelay: bar.delay,
              }}
            />
          ))}
        </div>
      </div>

      {soundBlocked && (
        <div className="pointer-events-none absolute bottom-7 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-medium tracking-wider text-white/85 uppercase backdrop-blur-md animate-pulse">
          Tap anywhere for Cinema Sound
        </div>
      )}
    </div>
  );
}
