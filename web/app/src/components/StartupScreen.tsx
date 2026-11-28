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
  let disposed = false;
  let closeTimer = 0;
  let blockedTimer = 0;

  const removeGestureListeners = () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('click', onGesture);
    window.removeEventListener('keydown', onGesture);
  };

  const trigger = () => {
    if (played || disposed || !ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx
        .resume()
        .then(() => {
          if (!played && !disposed && ctx?.state === 'running') {
            scheduleNotes(ctx);
          }
        })
        .catch(() => {});
      return false;
    }
    if (ctx.state === 'running') {
      scheduleNotes(ctx);
      return true;
    }
    return false;
  };

  const onStateChange = () => {
    if (!played && !disposed && ctx?.state === 'running') {
      scheduleNotes(ctx);
    }
  };

  const scheduleNotes = (audioCtx: AudioContext) => {
    if (played || disposed) return;
    played = true;
    window.clearTimeout(blockedTimer);
    removeGestureListeners();
    audioCtx.removeEventListener('statechange', onStateChange);
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
      // Neo-Brutalism: 808 punch + staccato acid-sawtooth 3-note riff + industrial chord
      const stomp = audioCtx.createOscillator();
      const stompGain = audioCtx.createGain();
      stomp.type = 'sine';
      stomp.frequency.setValueAtTime(145, now + 0.03);
      stomp.frequency.exponentialRampToValueAtTime(36, now + 0.3);
      stompGain.gain.setValueAtTime(0.0001, now + 0.03);
      stompGain.gain.exponentialRampToValueAtTime(0.75, now + 0.045);
      stompGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      stomp.connect(stompGain).connect(compressor);
      stomp.start(now + 0.03);
      stomp.stop(now + 0.38);

      const riffFilter = audioCtx.createBiquadFilter();
      riffFilter.type = 'lowpass';
      riffFilter.Q.setValueAtTime(5.5, now + 0.14);
      riffFilter.frequency.setValueAtTime(360, now + 0.14);
      riffFilter.frequency.exponentialRampToValueAtTime(3200, now + 0.42);
      riffFilter.frequency.exponentialRampToValueAtTime(620, now + 1.9);
      riffFilter.connect(compressor);

      [
        { freq: 82.41, at: 0.14, dur: 0.14 },
        { freq: 98.0, at: 0.28, dur: 0.14 },
        { freq: 164.81, at: 0.42, dur: 1.45 },
      ].forEach((n) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, now + n.at);
        g.gain.setValueAtTime(0.0001, now + n.at);
        g.gain.exponentialRampToValueAtTime(0.28, now + n.at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
        osc.connect(g).connect(riffFilter);
        osc.start(now + n.at);
        osc.stop(now + n.at + n.dur + 0.04);
      });
    } else if (uiMode === 'editorial') {
      // Editorial Magazine: 4 typewriter keystrokes + carriage-return bell + warm Gmaj9 Rhodes bloom
      for (const clickAt of [0.04, 0.11, 0.18, 0.25]) {
        try {
          const len = Math.floor(audioCtx.sampleRate * 0.022);
          const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          const bp = audioCtx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2400, now + clickAt);
          bp.Q.setValueAtTime(3.2, now + clickAt);
          const cg = audioCtx.createGain();
          cg.gain.setValueAtTime(0.32, now + clickAt);
          src.connect(bp).connect(cg).connect(compressor);
          src.start(now + clickAt);
        } catch {
          // ignore
        }
      }

      // Vintage carriage-return bell (D6)
      const bell = audioCtx.createOscillator();
      const bg = audioCtx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(1174.66, now + 0.33);
      bg.gain.setValueAtTime(0.0001, now + 0.33);
      bg.gain.exponentialRampToValueAtTime(0.18, now + 0.34);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
      bell.connect(bg).connect(compressor);
      bell.start(now + 0.33);
      bell.stop(now + 1.1);

      const warmFilter = audioCtx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.setValueAtTime(1600, now + 0.42);
      warmFilter.connect(compressor);

      [196.0, 246.94, 293.66, 369.99, 440.0].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const t = now + 0.42 + idx * 0.045;
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.25);
        osc.connect(g).connect(warmFilter);
        osc.start(t);
        osc.stop(now + 2.3);
      });
    } else if (uiMode === 'bento') {
      // Bento Grids: Apple-inspired marimba tap + silky Cmaj9 harmonic pad swell
      [
        { freq: 523.25, at: 0.05 },
        { freq: 783.99, at: 0.14 },
      ].forEach((tap) => {
        const m = audioCtx.createOscillator();
        const mg = audioCtx.createGain();
        m.type = 'sine';
        m.frequency.setValueAtTime(tap.freq, now + tap.at);
        mg.gain.setValueAtTime(0.0001, now + tap.at);
        mg.gain.exponentialRampToValueAtTime(0.28, now + tap.at + 0.01);
        mg.gain.exponentialRampToValueAtTime(0.0001, now + tap.at + 0.45);
        m.connect(mg).connect(compressor);
        m.start(now + tap.at);
        m.stop(now + tap.at + 0.5);
      });

      [261.63, 329.63, 392.0, 493.88, 587.33].forEach((freq, idx) => {
        const t = now + 0.24 + idx * 0.05;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.14);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.25);
        osc.connect(g).connect(compressor);
        osc.start(t);
        osc.stop(now + 2.3);
      });
    } else if (uiMode === 'retro') {
      // Retro iPod: accelerating click-wheel piezo clicks + nostalgic C5 -> G5 Aqua chime
      [0.05, 0.14, 0.22, 0.28, 0.33].forEach((offset) => {
        const t = now + offset;
        const click = audioCtx.createOscillator();
        const cg = audioCtx.createGain();
        click.type = 'triangle';
        click.frequency.setValueAtTime(3400, t);
        click.frequency.exponentialRampToValueAtTime(950, t + 0.015);
        cg.gain.setValueAtTime(0.0001, t);
        cg.gain.exponentialRampToValueAtTime(0.2, t + 0.002);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        click.connect(cg).connect(compressor);
        click.start(t);
        click.stop(t + 0.022);
      });

      [
        { freq: 523.25, at: 0.42 },
        { freq: 783.99, at: 0.58 },
      ].forEach((n) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.at);
        g.gain.setValueAtTime(0.0001, now + n.at);
        g.gain.exponentialRampToValueAtTime(0.26, now + n.at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(g).connect(compressor);
        osc.start(now + n.at);
        osc.stop(now + 2.25);
      });
    } else if (uiMode === 'anime') {
      // Anime Studio: title-card air-whoosh into uplifting J-Pop IV-V-I sparkle fanfare
      try {
        const bufSize = Math.floor(audioCtx.sampleRate * 0.24);
        const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuf;
        const bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(420, now);
        bp.frequency.exponentialRampToValueAtTime(4200, now + 0.22);
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(0.001, now);
        ng.gain.exponentialRampToValueAtTime(0.18, now + 0.14);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        noise.connect(bp).connect(ng).connect(compressor);
        noise.start(now);
      } catch {
        // ignore
      }

      const fanfare = [349.23, 392.0, 440.0, 523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, idx) => {
        const t = now + 0.14 + idx * 0.055;
        const osc = audioCtx.createOscillator();
        const overtone = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        const og = audioCtx.createGain();
        osc.type = 'triangle';
        overtone.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        overtone.frequency.setValueAtTime(freq * 2, t);
        og.gain.setValueAtTime(0.06, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);
        osc.connect(g).connect(compressor);
        overtone.connect(og).connect(g);
        osc.start(t);
        overtone.start(t);
        osc.stop(now + 2.4);
        overtone.stop(now + 2.4);
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

  // If browser blocked autoplay before gesture, unlock cleanly on first interaction while splash is up
  function onGesture() {
    trigger();
  }

  try {
    ctx = new AudioCtx();
    ctx.addEventListener('statechange', onStateChange);
    trigger();
    blockedTimer = window.setTimeout(() => {
      if (!played && !disposed && ctx && ctx.state === 'suspended') {
        onBlocked?.(true);
      }
    }, 120);
  } catch {
    return noop;
  }

  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('touchstart', onGesture, { passive: true });
  window.addEventListener('click', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture, { passive: true });

  return {
    unlock: () => {
      const wasBlocked = !played;
      trigger();
      return wasBlocked;
    },
    cleanup: () => {
      disposed = true;
      removeGestureListeners();
      if (ctx) ctx.removeEventListener('statechange', onStateChange);
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
    const exitDelay = reduced ? 350 : 2200;
    const unmountDelay = reduced ? 650 : 2700;

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
    const wasBlocked = soundCtrlRef.unlock();
    if (soundBlocked || wasBlocked) {
      setSoundBlocked(false);
      return;
    }
    setPhase('exiting');
  };

  // 6th UI: Anime Studio Startup Screen (Sakura Neon & Cel-Shaded Manga Title Card)
  if (uiMode === 'anime') {
    return (
      <div
        role="status"
        aria-label="Loading ISO pod"
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-4 transition-[opacity,transform] duration-500 ${
          exiting ? 'pointer-events-none scale-[1.04] opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          backgroundColor: 'var(--anime-bg, #0d0a1a)',
          backgroundImage:
            'radial-gradient(circle at 20% 25%, rgba(255,62,138,0.28), transparent 48%), radial-gradient(circle at 80% 75%, rgba(0,210,255,0.24), transparent 50%)',
          color: 'var(--anime-ink, #fdf7ff)',
        }}
      >
        {/* Manga Speed-Lines & Sakura Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-20%] opacity-15"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, transparent 0deg 6deg, rgba(255,62,138,0.35) 6deg 7.5deg, transparent 7.5deg 15deg)',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[14%] left-[14%] size-5 rounded-full bg-[#FF3E8A]/70 blur-[1px] animate-[anime-petal-float_2.4s_ease-in-out_infinite]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[24%] right-[16%] size-3.5 rounded-full bg-[#FFB800]/70 blur-[1px] animate-[anime-petal-float_2.9s_ease-in-out_0.25s_infinite]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[20%] bottom-[20%] size-4 rounded-full bg-[#00D2FF]/75 blur-[1px] animate-[anime-petal-float_3.1s_ease-in-out_0.4s_infinite]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[22%] left-[22%] size-3 rounded-full bg-[#7C3AED]/75 blur-[1px] animate-[anime-petal-float_2.7s_ease-in-out_0.6s_infinite]"
        />

        <div
          className="relative flex w-[min(480px,92vw)] max-h-[90dvh] flex-col items-center overflow-hidden rounded-[24px] border-2 px-7 py-8 text-center animate-[anime-slash-in_560ms_cubic-bezier(0.22,1,0.36,1)_both] [@media(orientation:landscape)_and_(max-height:580px)]:py-4 [@media(orientation:landscape)_and_(max-height:580px)]:px-5"
          style={{
            backgroundColor: 'var(--anime-card, #17122b)',
            borderColor: 'var(--anime-border, rgba(255,77,148,0.75))',
            boxShadow: '8px 8px 0 #FF3E8A, -6px -6px 0 rgba(0, 210, 255, 0.5), 0 24px 60px rgba(255,62,138,0.35)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[startup-sheen_1.2s_ease-in-out_200ms_1_forwards]"
          />
          <span className="mb-3 rounded-full bg-gradient-to-r from-[#FF3E8A] via-[#7C3AED] to-[#00D2FF] px-3.5 py-1 text-[10px] font-extrabold tracking-[0.22em] text-white uppercase shadow-md">
            サウンド &bull; Anime Studio Premiere
          </span>
          <LogoMark size={64} />
          <h1
            className="mt-3 text-5xl font-extrabold tracking-tight leading-none"
            style={{ fontFamily: "'M PLUS Rounded 1c', 'DM Sans', system-ui, sans-serif" }}
          >
            ISO{' '}
            <span className="bg-gradient-to-r from-[#FF3E8A] to-[#00D2FF] bg-clip-text text-transparent">
              pod
            </span>
          </h1>
          <p className="mt-2 text-xs font-bold tracking-[0.24em] uppercase opacity-80">
            Pure Sound &bull; Sakura Hi-Fi
          </p>

          <div className="mt-5 flex items-end gap-2" aria-hidden="true">
            {[18, 34, 24, 38, 28, 20].map((h, idx) => (
              <span
                key={idx}
                className="w-2.5 rounded-full bg-gradient-to-t from-[#FF3E8A] to-[#00D2FF]"
                style={{
                  height: `${h}px`,
                  animation: `anime-petal-float ${0.65 + idx * 0.1}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        </div>
        {soundBlocked && (
          <p className="mt-4 text-xs font-bold tracking-wider text-[#FF3E8A] uppercase">
            Tap anywhere for Anime Sound
          </p>
        )}
      </div>
    );
  }

  // 5th UI: Retro iPod / Skeuomorphic Hardware Startup Screen
  if (uiMode === 'retro') {
    return (
      <div
        role="status"
        aria-label="Loading ISO pod"
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-[9999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-4 transition-[opacity,transform] duration-500 ${
          exiting ? 'pointer-events-none scale-[1.03] opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          background: 'linear-gradient(180deg, var(--retro-metal-hi, #f7f8fa) 0%, var(--retro-metal, #e3e5ea) 50%, var(--retro-metal-lo, #c5c9d3) 100%)',
          color: 'var(--retro-ink, #111827)',
        }}
      >
        {/* Studio Hardware Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute size-[min(90vw,520px)] rounded-full bg-[radial-gradient(circle,rgba(91,176,255,0.28),transparent_65%)] blur-2xl"
        />

        <div
          className="relative flex w-[min(360px,90vw)] max-h-[92dvh] flex-col items-center gap-4 rounded-[32px] border p-5 shadow-[0_28px_64px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.9)] animate-[startup-logo_580ms_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{
            background: 'linear-gradient(180deg, var(--retro-metal-hi, #f7f8fa), var(--retro-metal-lo, #c5c9d3))',
            borderColor: 'var(--retro-bevel, #9ca3af)',
          }}
        >
          {/* Backlit LCD Screen */}
          <div
            className="relative flex w-full flex-col items-center overflow-hidden rounded-[14px] border px-5 py-5 text-center animate-[retro-lcd-boot_500ms_ease-out_both]"
            style={{
              backgroundColor: 'var(--retro-lcd, #edf1f5)',
              borderColor: 'var(--retro-bevel, #9ca3af)',
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.18)',
            }}
          >
            <span
              className="mb-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-[0.18em] text-white uppercase shadow-xs"
              style={{ background: 'linear-gradient(180deg, #5BB0FF, #146EF5)' }}
            >
              System Boot &bull; Hi-Fi DAC
            </span>
            <LogoMark size={52} />
            <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight">ISO pod</h1>
            <p className="text-[11px] font-semibold opacity-75">Pure Sound. Pocket Hi-Fi.</p>
            <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full border border-black/15 bg-black/10 p-[1px]">
              <div
                className="h-full w-full origin-left rounded-full animate-[editorial-rule_1.6s_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{
                  background: 'linear-gradient(180deg, #5BB0FF, #146EF5)',
                }}
              />
            </div>
          </div>

          {/* Tactile Click Wheel */}
          <div
            className="relative grid size-[148px] place-items-center rounded-full border shadow-[inset_0_2px_8px_rgba(0,0,0,0.16),0_3px_6px_rgba(255,255,255,0.7)] max-[580px]:hidden [@media(orientation:landscape)_and_(max-height:580px)]:hidden"
            style={{
              backgroundColor: 'var(--retro-lcd, #f3f4f6)',
              borderColor: 'var(--retro-bevel, #9ca3af)',
            }}
          >
            <span className="absolute top-3 text-[10px] font-bold tracking-wider opacity-75">MENU</span>
            <span className="absolute left-3.5 text-[11px] font-bold opacity-75">&#9664;&#9664;</span>
            <span className="absolute right-3.5 text-[11px] font-bold opacity-75">&#9654;&#9654;</span>
            <span className="absolute bottom-3 text-[10px] font-bold opacity-75">&#9654;&#10073;&#10073;</span>
            <div
              className="size-13 rounded-full border shadow-[inset_0_1px_3px_rgba(255,255,255,0.85),0_2px_4px_rgba(0,0,0,0.22)]"
              style={{
                background: 'linear-gradient(180deg, var(--retro-metal-hi, #f7f8fa), var(--retro-metal-lo, #c5c9d3))',
                borderColor: 'var(--retro-bevel, #9ca3af)',
              }}
            />
          </div>
        </div>
        {soundBlocked && (
          <p className="mt-3 text-[11px] font-semibold tracking-wider uppercase opacity-75">
            Tap anywhere for Startup Chime
          </p>
        )}
      </div>
    );
  }

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
        {/* Apple Keynote Radial Spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute size-[min(92vw,620px)] rounded-full bg-[radial-gradient(circle,rgba(0,122,255,0.22),rgba(124,58,237,0.14)_45%,transparent_72%)] blur-3xl"
        />

        <div className="relative grid w-[min(660px,94vw)] max-h-[90dvh] grid-cols-4 grid-rows-2 gap-3.5 max-sm:grid-cols-2 [@media(orientation:landscape)_and_(max-height:580px)]:gap-2">
          {/* 2x2 Feature Gradient Tile with Keynote Sheen */}
          <div
            className="relative col-span-2 row-span-2 flex flex-col justify-between overflow-hidden rounded-[28px] p-6 text-white shadow-[0_20px_48px_rgba(124,58,237,0.38)] animate-[bento-reveal_520ms_ease-out_both] [@media(orientation:landscape)_and_(max-height:580px)]:p-4"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6, #0066CC)' }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[startup-sheen_1.2s_ease-in-out_220ms_1_forwards]"
            />
            <LogoMark size={60} />
            <div>
              <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                Pocket Hi-Fi
              </span>
              <h1 className="mt-2 text-[36px] font-bold tracking-tight leading-none">ISO pod</h1>
              <p className="mt-1.5 text-xs font-medium text-white/85">Pure Sound. Engineered Clean.</p>
            </div>
          </div>

          {/* Blue Accent Tile */}
          <div
            className="col-span-2 flex flex-col justify-between rounded-[28px] p-5 text-white shadow-[0_12px_28px_rgba(0,102,204,0.25)] animate-[bento-reveal_520ms_ease-out_80ms_both]"
            style={{ background: 'linear-gradient(135deg, #007AFF, #0051A8)' }}
          >
            <span className="text-[11px] font-semibold tracking-wider uppercase text-white/75">Multi-Source Engine</span>
            <span className="text-xl font-semibold leading-tight">Audius &bull; iTunes &bull; YTM</span>
          </div>

          {/* Green Tile */}
          <div
            className="flex flex-col justify-between rounded-[28px] p-4 text-[#1D1D1F] shadow-md animate-[bento-reveal_520ms_ease-out_160ms_both]"
            style={{ backgroundColor: '#34C759' }}
          >
            <span className="text-[10px] font-bold uppercase opacity-75">Studio DSP</span>
            <span className="text-base font-bold leading-tight">10-Band EQ</span>
          </div>

          {/* Dark / Tile Card */}
          <div
            className="flex flex-col justify-between rounded-[28px] p-4 text-white shadow-md animate-[bento-reveal_520ms_ease-out_240ms_both]"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            <span className="text-[10px] font-bold uppercase text-white/60">Spatial</span>
            <span className="text-base font-bold leading-tight">Live Lyrics</span>
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
        <div className="flex w-[min(620px,92vw)] max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between gap-3 animate-[editorial-rise_500ms_ease-out_both]">
            <span
              className="text-[11px] font-bold tracking-[0.22em] uppercase"
              style={{ color: 'var(--ed-accent, #dc2626)' }}
            >
              Issue No. 01 &bull; Collector&rsquo;s Edition
            </span>
            <span
              className="border px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase rotate-[-3deg]"
              style={{ borderColor: 'var(--ed-accent, #dc2626)', color: 'var(--ed-accent, #dc2626)' }}
            >
              Hi-Fi Press
            </span>
          </div>

          <div
            className="mt-3 mb-1 h-[3px] w-full origin-left animate-[editorial-rule_650ms_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ backgroundColor: 'var(--ed-ink, #000000)' }}
          />
          <div
            className="mb-4 h-[1px] w-full origin-right animate-[editorial-rule_750ms_cubic-bezier(0.22,1,0.36,1)_80ms_both]"
            style={{ backgroundColor: 'var(--ed-ink, #000000)' }}
          />

          <div className="flex items-center justify-between gap-6 py-2 animate-[editorial-rise_650ms_cubic-bezier(0.22,1,0.36,1)_120ms_both]">
            <h1
              className="text-[54px] sm:text-[72px] font-black leading-[0.98] tracking-[-0.03em]"
              style={{ fontFamily: 'var(--ed-display, "Playfair Display", Georgia, serif)' }}
            >
              ISO pod
            </h1>
            <LogoMark size={68} />
          </div>

          <p
            className="mt-3 font-serif text-base italic animate-[editorial-rise_650ms_cubic-bezier(0.22,1,0.36,1)_220ms_both]"
            style={{ color: 'var(--ed-muted, #6b7280)' }}
          >
            &ldquo;Unlimited playlist curation &amp; multi-source hi-fi streaming, typeset for the modern listener.&rdquo;
          </p>

          <div
            className="mt-5 h-[3px] w-full origin-left animate-[editorial-rule_1.6s_cubic-bezier(0.22,1,0.36,1)_180ms_both]"
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 inset-x-0 overflow-hidden border-t-[3px] py-1.5 text-[11px] font-black tracking-[0.22em] uppercase"
          style={{
            backgroundColor: 'var(--brutal-accent-2, #ff3d00)',
            color: 'var(--brutal-accent-2-ink, #ffffff)',
            borderColor: 'var(--brutal-ink, #0b0b0d)',
          }}
        >
          <div className="flex w-max whitespace-nowrap animate-[brutal-marquee_12s_linear_reverse_infinite]">
            <span className="px-4">RAW AUDIO // DUAL-TONE // HIGH IMPACT // NO COMPROMISE //</span>
            <span className="px-4">RAW AUDIO // DUAL-TONE // HIGH IMPACT // NO COMPROMISE //</span>
            <span className="px-4">RAW AUDIO // DUAL-TONE // HIGH IMPACT // NO COMPROMISE //</span>
            <span className="px-4">RAW AUDIO // DUAL-TONE // HIGH IMPACT // NO COMPROMISE //</span>
          </div>
        </div>

        {/* Center Hard-Slam Poster Card */}
        <div
          className="relative z-10 mx-4 flex w-[min(390px,90vw)] max-h-[82dvh] flex-col items-center rounded-[14px] border-[3px] px-7 py-8 animate-[brutal-slam_520ms_cubic-bezier(0.22,1,0.36,1)_both] [@media(orientation:landscape)_and_(max-height:580px)]:py-4 [@media(orientation:landscape)_and_(max-height:580px)]:px-5"
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
