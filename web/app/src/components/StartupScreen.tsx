import { useEffect, useState, type CSSProperties } from 'react';
import { LogoMark } from '@/components/icons/LogoMark';

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
 * Synthesizes a cinematic Netflix-style "Ta-Dum" sub-bass + harmonic chord swell
 * exclusively for the startup screen using a self-contained disposable AudioContext.
 */
function playStartupSound(): () => void {
  if (typeof window === 'undefined') return () => {};
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return () => {};

  let ctx: AudioContext | null = null;
  let played = false;
  let closeTimer = 0;

  const trigger = () => {
    if (played || !ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (!played && ctx?.state === 'running') scheduleNotes(ctx);
      });
      return;
    }
    if (ctx.state === 'running') scheduleNotes(ctx);
  };

  const scheduleNotes = (audioCtx: AudioContext) => {
    if (played) return;
    played = true;
    const now = audioCtx.currentTime;

    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.28, now + 0.03);
    master.gain.setValueAtTime(0.28, now + 1.1);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.05);
    master.connect(audioCtx.destination);

    // Hit 1: "Ta" (punchy low thump)
    const taOsc = audioCtx.createOscillator();
    const taGain = audioCtx.createGain();
    taOsc.type = 'sine';
    taOsc.frequency.setValueAtTime(118, now + 0.04);
    taOsc.frequency.exponentialRampToValueAtTime(56, now + 0.22);
    taGain.gain.setValueAtTime(0.0001, now + 0.04);
    taGain.gain.exponentialRampToValueAtTime(0.75, now + 0.06);
    taGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    taOsc.connect(taGain).connect(master);
    taOsc.start(now + 0.04);
    taOsc.stop(now + 0.28);

    // Hit 2: "Dum" (deep cinematic sub-bass drop)
    const dumOsc = audioCtx.createOscillator();
    const dumGain = audioCtx.createGain();
    dumOsc.type = 'triangle';
    dumOsc.frequency.setValueAtTime(98, now + 0.28);
    dumOsc.frequency.exponentialRampToValueAtTime(46, now + 1.25);
    dumGain.gain.setValueAtTime(0.0001, now + 0.28);
    dumGain.gain.exponentialRampToValueAtTime(0.95, now + 0.31);
    dumGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);
    dumOsc.connect(dumGain).connect(master);
    dumOsc.start(now + 0.28);
    dumOsc.stop(now + 1.9);

    // Warm multi-voice harmonic chord swell synced with the multi-color ribbon burst
    const chordFreqs = [130.81, 196.0, 293.66, 329.63]; // C3, G3, D4, E4
    for (const freq of chordFreqs) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.3);
      gain.gain.setValueAtTime(0.0001, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.65);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.95);
      osc.connect(gain).connect(master);
      osc.start(now + 0.3);
      osc.stop(now + 2.0);
    }

    closeTimer = window.setTimeout(() => {
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    }, 2150);
  };

  try {
    ctx = new AudioCtx();
    trigger();
  } catch {
    return () => {};
  }

  // If browser blocked autoplay before gesture, unlock cleanly on first interaction while splash is up
  const onGesture = () => trigger();
  window.addEventListener('pointerdown', onGesture, { once: true, passive: true });
  window.addEventListener('keydown', onGesture, { once: true, passive: true });

  return () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
    window.clearTimeout(closeTimer);
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => {});
    }
    ctx = null;
  };
}

/**
 * Cinematic Netflix-inspired multi-color startup splash screen.
 * Opens on pitch-black with spring-scaled LogoMark, then erupts into multi-color
 * vertical spectrum ribbons & smooth zoom-through transition into the app.
 */
export function StartupScreen() {
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'gone'>('visible');

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const exitDelay = reduced ? 350 : 1900;
    const unmountDelay = reduced ? 650 : 2400;

    const cleanupSound = reduced ? () => {} : playStartupSound();
    const t1 = window.setTimeout(() => setPhase('exiting'), exitDelay);
    const t2 = window.setTimeout(() => setPhase('gone'), unmountDelay);
    return () => {
      cleanupSound();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;

  const exiting = phase === 'exiting';

  return (
    <div
      role="status"
      aria-label="Loading BitChord"
      onClick={() => setPhase('exiting')}
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
            className="pointer-events-none absolute size-36 rounded-[36px] border border-[#E50914]/45 animate-[startup-ring_1.7s_cubic-bezier(0.16,1,0.3,1)_infinite]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-36 rounded-[36px] border border-[#00F2FE]/35 animate-[startup-ring_1.7s_cubic-bezier(0.16,1,0.3,1)_420ms_infinite]"
          />

          {/* Glass icon badge with multi-color rim + diagonal sheen */}
          <div className="relative grid size-24 place-items-center overflow-hidden rounded-[26px] border border-white/20 bg-white/[0.06] shadow-[0_0_50px_-6px_rgba(229,9,20,0.65),0_0_80px_-10px_rgba(124,58,237,0.5)] backdrop-blur-2xl animate-[startup-logo_650ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[startup-sheen_1.1s_ease-in-out_250ms_1_forwards]"
            />
            <LogoMark
              size={48}
              className="relative text-white drop-shadow-[0_0_18px_rgba(229,9,20,0.9)]"
            />
          </div>
        </div>

        {/* Multi-color gradient brand wordmark */}
        <div className="mt-7 flex flex-col items-center gap-1.5 text-center animate-[startup-text_650ms_cubic-bezier(0.16,1,0.3,1)_160ms_both]">
          <h1 className="text-[34px] font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(229,9,20,0.45)]">
            Bit
            <span className="bg-gradient-to-r from-[#E50914] via-[#FF2D55] via-[#A855F7] to-[#00F2FE] bg-clip-text text-transparent">
              Chord
            </span>
          </h1>
          <p className="type-caption-1 tracking-[0.26em] text-white/70 uppercase">
            Hi-Fi &bull; Automix &bull; Seamless
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
    </div>
  );
}
