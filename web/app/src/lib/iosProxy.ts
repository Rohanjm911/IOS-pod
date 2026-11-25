import { useSyncExternalStore } from 'react';
import { config } from '@/config';

const PROXY_STORAGE_KEY = 'bitchord:yt-proxy-url';
const BUILTIN_PROXY_PATH = '/api/proxy';
const listeners = new Set<() => void>();

function normalizeProxyBase(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function readStoredProxy(): string | null {
  try {
    return normalizeProxyBase(localStorage.getItem(PROXY_STORAGE_KEY));
  } catch {
    return null;
  }
}

let customProxy: string | null = readStoredProxy() ?? normalizeProxyBase(config.ytProxyUrl);
let builtinAvailable: boolean | null = customProxy ? null : typeof window === 'undefined' ? false : null;

function activeProxy(): string | null {
  return customProxy ?? (builtinAvailable ? BUILTIN_PROXY_PATH : null);
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** Probes same-origin `/api/proxy?health=1` (Vercel Edge / local Vite) once when no custom proxy is saved. */
function probeBuiltInProxy(): void {
  if (customProxy || typeof window === 'undefined' || typeof fetch === 'undefined') return;
  void fetch(`${BUILTIN_PROXY_PATH}?health=1`, { signal: AbortSignal.timeout(3000) })
    .then(async (res) => {
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      return !!data?.ok;
    })
    .catch(() => false)
    .then((ok) => {
      builtinAvailable = ok;
      notify();
    });
}

probeBuiltInProxy();

/** Active iOS/CORS proxy base URL (custom Worker or built-in `/api/proxy`), or null when unavailable. */
export function getProxyUrl(): string | null {
  return activeProxy();
}

/** True while checking whether the built-in `/api/proxy` endpoint is live. */
export function useProxyChecking(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => !customProxy && builtinAvailable === null,
  );
}

/** Saves or clears the user's custom proxy URL in localStorage (passing empty clears override). */
export function setProxyUrl(raw: string): string | null {
  const normalized = normalizeProxyBase(raw);
  try {
    if (normalized) localStorage.setItem(PROXY_STORAGE_KEY, normalized);
    else localStorage.removeItem(PROXY_STORAGE_KEY);
  } catch {
    // Ignore storage errors in private browsing modes.
  }
  customProxy = normalized ?? (raw.trim() ? null : normalizeProxyBase(config.ytProxyUrl));
  if (!customProxy) {
    builtinAvailable = null;
    probeBuiltInProxy();
  }
  notify();
  return activeProxy();
}

/** React subscription for the configured proxy URL. */
export function useProxyUrl(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => activeProxy(),
  );
}

const PROXYABLE_HOSTS = new Set([
  'music.youtube.com',
  'www.youtube.com',
  'youtube.com',
  'music.apple.com',
  'amp-api.music.apple.com',
  'mobileservice.kugou.com',
  'lyrics.kugou.com',
  'apic.musixmatch.com',
  'www.musixmatch.com',
  'genius.com',
  'api.paxsenix.org',
  'lyrics.paxsenix.org',
  'lyrics-api.binimum.org',
  'lyricsplus.binimum.org',
  'lyricsplus.prjktla.my.id',
  'lyrics-api.boidu.dev',
  'unison.boidu.dev',
  'lrclib.net',
  'lrc.red',
  'translate.googleapis.com',
  'itunes.apple.com',
  'open.spotify.com',
  'api-partner.spotify.com',
  'open.spotifycdn.com',
  'api.deezer.com',
]);

export function isProxyableUrl(targetUrl: string): boolean {
  try {
    const { protocol, hostname } = new URL(targetUrl);
    if (protocol !== 'https:') return false;
    const host = hostname.toLowerCase();
    return PROXYABLE_HOSTS.has(host) || host.endsWith('.googlevideo.com');
  } catch {
    return false;
  }
}

/** Rewrites [targetUrl] through the active proxy when available and permitted. */
export function proxiedUrl(targetUrl: string): string {
  const base = activeProxy();
  if (!base || !isProxyableUrl(targetUrl)) return targetUrl;
  const origin = typeof location !== 'undefined' ? location.origin : 'https://localhost';
  const url = new URL(base, origin);
  // Avoid double-wrapping URLs that already point at the proxy.
  if (targetUrl.startsWith(url.toString()) || targetUrl.startsWith(`${url.pathname}?`)) return targetUrl;
  url.searchParams.set('url', targetUrl);
  // Always return a full URL with origin so callers passing it to `new URL(...)`
  // or DASH manifests never fail with `Invalid URL`.
  return url.toString();
}

/** Verifies that [candidate] responds on its health endpoint (`/health` or `?health=1`). */
export async function testProxyHealth(candidate: string): Promise<{ ok: boolean; message: string }> {
  const base = normalizeProxyBase(candidate);
  if (!base) return { ok: false, message: 'Enter a valid https:// URL or /api/proxy.' };
  const origin = typeof location !== 'undefined' ? location.origin : 'https://localhost';
  const healthUrl = new URL(base, origin);
  if (healthUrl.pathname === '/' || healthUrl.pathname === '') {
    healthUrl.pathname = '/health';
  } else {
    healthUrl.searchParams.set('health', '1');
  }
  try {
    const res = await fetch(base.startsWith('/') ? `${healthUrl.pathname}${healthUrl.search}` : healthUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, message: `Proxy returned HTTP ${res.status}` };
    const data = (await res.json().catch(() => null)) as { ok?: boolean; service?: string } | null;
    if (data?.ok) return { ok: true, message: 'Proxy reachable and ready.' };
    return { ok: false, message: 'Unexpected health response from proxy.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not reach proxy.' };
  }
}
