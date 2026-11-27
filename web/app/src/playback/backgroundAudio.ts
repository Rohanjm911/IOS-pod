/**
 * Background playback keep-alive for iOS Safari, Android Chrome, and desktop tabs.
 *
 * Mobile browsers suspend JS timers and revoke MediaSession lock-screen controls
 * during track-switch gaps (`await engine.load(...)`) or when a YouTube IFrame
 * plays without an active parent `<audio>` element. Playing a silent 1-second
 * PCM WAV loop at near-zero volume (`0.001`, unmuted) keeps the OS audio session
 * and MediaSession active continuously while music is playing or transitioning.
 */

let keepAliveAudio: HTMLAudioElement | null = null;
let keepAliveUrl: string | null = null;
let wantActive = false;
let lifecycleBound = false;

/** Builds a minimal 1-second 8kHz mono 8-bit silent WAV data URL (100% inaudible). */
function buildSilentWavDataUrl(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate; // 1 second
  const dataSize = numSamples;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // 8-bit unsigned PCM
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  // 8-bit unsigned PCM silence is 128 (0x80)
  new Uint8Array(buffer, 44).fill(128);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function ensureKeepAliveAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!keepAliveAudio) {
    keepAliveUrl = buildSilentWavDataUrl();
    const audio = new Audio(keepAliveUrl);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.001; // Unmuted near-zero volume so iOS/Android honors background audio session
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    keepAliveAudio = audio;
  }
  return keepAliveAudio;
}

/** Call inside a synchronous user gesture (play/next/prev) to unlock background keep-alive. */
export function unlockBackgroundKeepAlive(): void {
  const audio = ensureKeepAliveAudio();
  if (!audio) return;
  if (audio.paused && wantActive) {
    void audio.play().catch(() => {});
  } else if (!audio.currentSrc) {
    audio.load();
  }
}

/** Enables or pauses the silent keep-alive loop based on whether playback is active/loading. */
export function setBackgroundKeepAlive(active: boolean): void {
  wantActive = active;
  const audio = ensureKeepAliveAudio();
  if (!audio) return;
  if (active) {
    if (audio.paused) void audio.play().catch(() => {});
  } else if (!audio.paused) {
    audio.pause();
  }
}

/** Binds visibility/focus lifecycle listeners once to keep AudioContext & playback alive across tab switches. */
export function registerBackgroundLifecycle(onResumeNeeded: () => void): void {
  if (lifecycleBound || typeof document === 'undefined') return;
  lifecycleBound = true;

  const handleLifecycle = () => {
    if (!wantActive) return;
    onResumeNeeded();
    const audio = keepAliveAudio;
    if (audio && audio.paused) {
      void audio.play().catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleLifecycle);
  window.addEventListener('pageshow', handleLifecycle);
  window.addEventListener('focus', handleLifecycle);
}
