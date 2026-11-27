/**
 * YouTube IFrame Player fallback adapter.
 *
 * When YouTube's `/youtubei/v1/player` endpoint rejects datacenter/proxy IPs
 * (e.g. Vercel Edge returning "Sign in to confirm you're not a bot"), this
 * adapter plays the track through YouTube's official IFrame Player API directly
 * from the user's own browser and IP, bridging its state onto the existing
 * `HTMLAudioElement` so scrubbers, lyrics, MediaSession, and queue advance
 * continue working seamlessly.
 */

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YtIframePlayer }) => void;
            onStateChange?: (e: { data: number; target: YtIframePlayer }) => void;
            onError?: (e: { data: number }) => void;
          };
        },
      ) => YtIframePlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtIframePlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  destroy(): void;
}

let apiPromise: Promise<NonNullable<Window['YT']>> | null = null;

export function ensureYtIframeApi(): Promise<NonNullable<Window['YT']>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API requires a browser'));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error('Timed out loading YouTube IFrame API'));
    }, 12_000);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else {
        apiPromise = null;
        reject(new Error('YouTube IFrame API ready callback fired without YT.Player'));
      }
    };

    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timer);
        apiPromise = null;
        reject(new Error('Failed to load YouTube IFrame API script'));
      };
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

const BRIDGED_PROPS = ['currentTime', 'duration', 'paused', 'ended', 'volume', 'muted', 'play', 'pause'] as const;

export class IframePlayerAdapter {
  private player: YtIframePlayer | null = null;
  private rawPlayer: YtIframePlayer | null = null;
  private container: HTMLDivElement | null = null;
  private tickTimer: number | null = null;
  private disposed = false;
  private cachedTime = 0;
  private cachedDuration = 0;
  private isPaused = true;
  private isEnded = false;
  private userPaused = true;
  private bgResumeTimer: number | null = null;
  private bgResumeAttempts = 0;
  private currentVolume: number;
  private isMuted: boolean;

  constructor(private readonly audio: HTMLAudioElement) {
    this.currentVolume = audio.volume;
    this.isMuted = audio.muted;
  }

  async load(
    videoId: string,
    { startSec = 0, autoplay = true, fallbackDurationSec = 0 }: { startSec?: number; autoplay?: boolean; fallbackDurationSec?: number } = {},
  ): Promise<{ durationSec: number }> {
    const YT = await ensureYtIframeApi();
    if (this.disposed) throw new Error('Adapter disposed');

    this.cachedTime = startSec;
    this.cachedDuration = fallbackDurationSec;
    this.isPaused = !autoplay;
    this.isEnded = false;
    this.userPaused = !autoplay;
    this.bgResumeAttempts = 0;
    this.clearBgResume();

    // Pause and clear any native audio element source so it never competes with the iframe.
    this.audio.pause();
    if (this.audio.getAttribute('src')) {
      this.audio.removeAttribute('src');
      this.audio.load();
    }

    this.mountBridge();

    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;bottom:0;right:0;width:200px;height:200px;opacity:0.001;pointer-events:none;z-index:-1;overflow:hidden;';
    const target = document.createElement('div');
    host.appendChild(target);
    document.body.appendChild(host);
    this.container = host;

    return new Promise((resolve, reject) => {
      let settled = false;
      let readyDone = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('YouTube IFrame player timed out'));
      }, 15_000);

      let autoplayFallbackTimer: number | null = null;
      const finish = (durationSec: number) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (autoplayFallbackTimer !== null) window.clearTimeout(autoplayFallbackTimer);
        resolve({ durationSec });
      };

      const fail = (err: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (autoplayFallbackTimer !== null) window.clearTimeout(autoplayFallbackTimer);
        reject(err);
      };

      this.rawPlayer = new YT.Player(target, {
        width: 200,
        height: 200,
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          start: Math.floor(startSec),
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (this.disposed) {
              fail(new Error('Adapter disposed'));
              return;
            }
            readyDone = true;
            const p = e.target;
            this.player = p;
            if (typeof p.setVolume === 'function') p.setVolume(Math.round(this.currentVolume * 100));
            if (this.isMuted) {
              if (typeof p.mute === 'function') p.mute();
            } else if (typeof p.unMute === 'function') {
              p.unMute();
            }
            if (startSec > 0 && typeof p.seekTo === 'function') p.seekTo(startSec, true);

            const dur = (typeof p.getDuration === 'function' ? p.getDuration() : 0) || fallbackDurationSec || 0;
            this.cachedDuration = dur;
            this.audio.dispatchEvent(new Event('durationchange'));
            this.startTicker();

            if (autoplay) {
              if (typeof p.playVideo === 'function') p.playVideo();
              // Wait briefly for PLAYING (so immediate embed errors 101/150 reject cleanly),
              // or resolve as paused if the browser blocked autoplay.
              autoplayFallbackTimer = window.setTimeout(() => {
                const liveDur = typeof this.player?.getDuration === 'function' ? this.player.getDuration() : 0;
                finish(liveDur || dur);
              }, 2500);
            } else {
              finish(dur);
            }
          },
          onStateChange: (e) => {
            if (this.disposed) return;
            const state = e.data;
            const dur = typeof this.player?.getDuration === 'function' ? this.player.getDuration() : 0;
            if (dur > 0 && dur !== this.cachedDuration) {
              this.cachedDuration = dur;
              this.audio.dispatchEvent(new Event('durationchange'));
            }
            if (state === YT.PlayerState.PLAYING) {
              this.isPaused = false;
              this.isEnded = false;
              this.userPaused = false;
              this.bgResumeAttempts = 0;
              this.clearBgResume();
              this.audio.dispatchEvent(new Event('play'));
              this.audio.dispatchEvent(new Event('playing'));
              if (readyDone) finish(dur || this.cachedDuration);
            } else if (state === YT.PlayerState.PAUSED) {
              this.isPaused = true;
              if (typeof this.player?.getCurrentTime === 'function') {
                this.cachedTime = this.player.getCurrentTime();
              }
              // Mobile/desktop browsers sometimes auto-pause background iframes when a tab hides;
              // recover automatically unless the user explicitly paused.
              if (
                typeof document !== 'undefined' &&
                document.hidden &&
                !this.userPaused &&
                !this.isEnded &&
                this.bgResumeAttempts < 2
              ) {
                this.bgResumeAttempts++;
                this.clearBgResume();
                this.bgResumeTimer = window.setTimeout(() => {
                  this.bgResumeTimer = null;
                  if (!this.disposed && !this.userPaused && !this.isEnded) {
                    this.player?.playVideo?.();
                  }
                }, 150);
                return;
              }
              this.audio.dispatchEvent(new Event('pause'));
            } else if (state === YT.PlayerState.BUFFERING) {
              this.audio.dispatchEvent(new Event('waiting'));
            } else if (state === YT.PlayerState.ENDED) {
              this.isPaused = true;
              this.isEnded = true;
              this.audio.dispatchEvent(new Event('ended'));
            }
          },
          onError: (e) => {
            fail(new Error(`YouTube embed error ${e.data}`));
          },
        },
      });
    });
  }

  private startTicker() {
    if (this.tickTimer !== null) return;
    this.tickTimer = window.setInterval(() => {
      if (this.disposed || !this.player || this.isPaused) return;
      if (typeof this.player.getCurrentTime === 'function') {
        const t = this.player.getCurrentTime();
        if (Number.isFinite(t)) this.cachedTime = t;
      }
      if (typeof this.player.getDuration === 'function') {
        const dur = this.player.getDuration();
        if (Number.isFinite(dur) && dur > 0 && dur !== this.cachedDuration) {
          this.cachedDuration = dur;
          this.audio.dispatchEvent(new Event('durationchange'));
        }
      }
      this.audio.dispatchEvent(new Event('timeupdate'));
    }, 250);
  }

  private mountBridge() {
    const audio = this.audio;
    const self = this;

    Object.defineProperty(audio, 'currentTime', {
      configurable: true,
      get: () => {
        if (typeof self.player?.getCurrentTime === 'function') {
          const t = self.player.getCurrentTime();
          if (typeof t === 'number' && Number.isFinite(t)) self.cachedTime = t;
        }
        return self.cachedTime;
      },
      set: (sec: number) => {
        self.cachedTime = Math.max(0, sec);
        if (typeof self.player?.seekTo === 'function') self.player.seekTo(self.cachedTime, true);
        audio.dispatchEvent(new Event('seeked'));
        audio.dispatchEvent(new Event('timeupdate'));
      },
    });

    Object.defineProperty(audio, 'duration', {
      configurable: true,
      get: () => {
        const d = typeof self.player?.getDuration === 'function' ? self.player.getDuration() : 0;
        return d || self.cachedDuration || 0;
      },
    });

    Object.defineProperty(audio, 'paused', {
      configurable: true,
      get: () => self.isPaused,
    });

    Object.defineProperty(audio, 'ended', {
      configurable: true,
      get: () => self.isEnded,
    });

    Object.defineProperty(audio, 'volume', {
      configurable: true,
      get: () => self.currentVolume,
      set: (v: number) => {
        self.currentVolume = Math.max(0, Math.min(1, v));
        if (typeof self.player?.setVolume === 'function') self.player.setVolume(Math.round(self.currentVolume * 100));
        audio.dispatchEvent(new Event('volumechange'));
      },
    });

    Object.defineProperty(audio, 'muted', {
      configurable: true,
      get: () => self.isMuted,
      set: (m: boolean) => {
        self.isMuted = !!m;
        if (self.isMuted) {
          if (typeof self.player?.mute === 'function') self.player.mute();
        } else if (typeof self.player?.unMute === 'function') {
          self.player.unMute();
        }
        audio.dispatchEvent(new Event('volumechange'));
      },
    });

    Object.defineProperty(audio, 'play', {
      configurable: true,
      value: async () => {
        self.isPaused = false;
        self.isEnded = false;
        self.userPaused = false;
        self.bgResumeAttempts = 0;
        self.clearBgResume();
        if (typeof self.player?.playVideo === 'function') self.player.playVideo();
        audio.dispatchEvent(new Event('play'));
        audio.dispatchEvent(new Event('playing'));
      },
    });

    Object.defineProperty(audio, 'pause', {
      configurable: true,
      value: () => {
        self.isPaused = true;
        self.userPaused = true;
        self.clearBgResume();
        if (typeof self.player?.pauseVideo === 'function') self.player.pauseVideo();
        audio.dispatchEvent(new Event('pause'));
      },
    });
  }

  private clearBgResume() {
    if (this.bgResumeTimer !== null) {
      window.clearTimeout(this.bgResumeTimer);
      this.bgResumeTimer = null;
    }
  }

  private unmountBridge() {
    const record = this.audio as unknown as Record<string, unknown>;
    for (const prop of BRIDGED_PROPS) {
      try {
        delete record[prop];
      } catch {
        // Ignore if not configurable
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearBgResume();
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.unmountBridge();
    try {
      if (typeof this.player?.stopVideo === 'function') this.player.stopVideo();
      if (typeof (this.player ?? this.rawPlayer)?.destroy === 'function') {
        (this.player ?? this.rawPlayer)!.destroy();
      }
    } catch {
      // Ignore destroy errors
    }
    this.player = null;
    this.rawPlayer = null;
    this.container?.remove();
    this.container = null;
  }
}
