import { setDefaultResultOrder } from 'node:dns';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Avoid slow IPv6 connection timeouts before falling back to IPv4 on Windows/local networks.
setDefaultResultOrder('ipv4first');

// The development extension's id, pinned by its manifest `key`
// (web/extension/dev-key/). Read at build time so the page can message it.
function devExtensionId(): string {
  try {
    return readFileSync(new URL('../extension/dev-key/extension-id.txt', import.meta.url), 'utf8').trim();
  } catch {
    return '';
  }
}

const EXACT_PROXY_HOSTS = new Set([
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

function isAllowedProxyHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return EXACT_PROXY_HOSTS.has(host) || host.endsWith('.googlevideo.com');
}

function localProxyPlugin(): Plugin {
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const RATE_WINDOW_MS = 60_000;
  const MAX_API_REQS = 120;
  const MAX_MEDIA_REQS = 240;

  const mount = (middlewares: {
    use: (
      path: string,
      fn: (
        req: import('node:http').IncomingMessage,
        res: import('node:http').ServerResponse,
      ) => void,
    ) => void;
  }) => {
    middlewares.use('/api/proxy', async (req, res) => {
      const origin = (req.headers.origin as string | undefined) || '*';
      const setCors = () => {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type, *');
        res.setHeader('Vary', 'Origin');
      };
      setCors();

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const parsedReq = new globalThis.URL(req.url ?? '/', 'http://localhost');
      if (parsedReq.searchParams.get('health') === '1') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, service: 'bitchord-local-proxy' }));
        return;
      }

      const rawTarget = parsedReq.searchParams.get('url');
      if (!rawTarget) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
        return;
      }

      let target: globalThis.URL;
      try {
        target = new globalThis.URL(rawTarget);
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Invalid target URL' }));
        return;
      }

      if (target.protocol !== 'https:' || !isAllowedProxyHost(target.hostname)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: `Host not allowed: ${target.hostname}` }));
        return;
      }

      const now = Date.now();
      const isMedia = Boolean(req.headers.range) || target.hostname.toLowerCase().endsWith('.googlevideo.com');
      const limit = isMedia ? MAX_MEDIA_REQS : MAX_API_REQS;
      const clientIp =
        (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',')[0]?.trim()) ||
        req.socket.remoteAddress ||
        'local';
      const bucketKey = `${clientIp}:${isMedia ? 'media' : 'api'}`;
      let bucket = rateBuckets.get(bucketKey);
      if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
        rateBuckets.set(bucketKey, bucket);
      }
      bucket.count += 1;
      const resetSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
      res.setHeader('X-RateLimit-Reset', String(resetSec));
      if (bucket.count > limit) {
        res.statusCode = 429;
        res.setHeader('Retry-After', String(resetSec));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Too many requests. Please slow down.', retryAfterSec: resetSec }));
        return;
      }

      const method = (req.method ?? 'GET').toUpperCase();
      const headers = new Headers();
      for (const name of ['accept', 'accept-language', 'content-type', 'range', 'if-range', 'x-goog-api-key', 'x-user-agent']) {
        const val = req.headers[name];
        if (typeof val === 'string') headers.set(name, val);
      }

      const host = target.hostname.toLowerCase();
      if (host === 'music.youtube.com') {
        headers.set('Origin', 'https://music.youtube.com');
        headers.set('Referer', 'https://music.youtube.com/');
        headers.set('X-Origin', 'https://music.youtube.com');
      } else if (host === 'www.youtube.com' || host === 'youtube.com') {
        if (target.pathname.startsWith('/youtubei/') || target.pathname.startsWith('/api/jnn/')) {
          headers.set('Origin', 'https://www.youtube.com');
          headers.set('Referer', 'https://www.youtube.com/');
          headers.set('X-Origin', 'https://www.youtube.com');
        }
      } else if (host.endsWith('.googlevideo.com')) {
        if (target.searchParams.get('c') !== 'VISIONOS') {
          headers.set('Origin', 'https://www.youtube.com');
          headers.set('Referer', 'https://www.youtube.com/');
        }
      } else if (host === 'music.apple.com' || host === 'amp-api.music.apple.com') {
        headers.set('Origin', 'https://music.apple.com');
        headers.set('Referer', 'https://music.apple.com/');
        const auth = req.headers.authorization;
        if (typeof auth === 'string') headers.set('Authorization', auth);
      } else if (host === 'api-partner.spotify.com' || host === 'open.spotify.com') {
        headers.set('Origin', 'https://open.spotify.com');
        headers.set('Referer', 'https://open.spotify.com/');
        const auth = req.headers.authorization;
        if (typeof auth === 'string') headers.set('Authorization', auth);
        const platform = req.headers['app-platform'];
        if (typeof platform === 'string') headers.set('App-Platform', platform);
      }

      let body: Buffer | undefined;
      if (method === 'POST') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        body = Buffer.concat(chunks);
      }

      try {
        const upstream = await fetch(target.toString(), {
          method,
          headers,
          body: body ? new Uint8Array(body) : undefined,
          redirect: 'follow',
        });
        res.statusCode = upstream.status;
        const encoded = upstream.headers.has('content-encoding');
        upstream.headers.forEach((value, key) => {
          const lower = key.toLowerCase();
          if (
            lower === 'set-cookie' ||
            lower === 'content-security-policy' ||
            lower === 'x-frame-options' ||
            lower === 'content-encoding' ||
            lower === 'transfer-encoding' ||
            (encoded && lower === 'content-length')
          ) {
            return;
          }
          res.setHeader(key, value);
        });
        setCors();
        if (!upstream.body || method === 'HEAD') {
          res.end();
          return;
        }
        Readable.fromWeb(upstream.body as import('node:stream/web').ReadableStream).pipe(res);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    });
  };

  return {
    name: 'bitchord-local-proxy',
    configureServer(server) {
      mount(server.middlewares);
    },
    configurePreviewServer(server) {
      mount(server.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localProxyPlugin()],
  define: {
    DEV_EXTENSION_ID: JSON.stringify(devExtensionId()),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // AutoMix's analysis worker (playback/automix): essentia.js's 2021-era
  // Emscripten glue breaks under dep pre-bundling, and the worker is a module.
  optimizeDeps: { exclude: ['essentia.js'] },
  worker: { format: 'es' },
  server: {
    // The extension's externally_connectable and DNR rules name this origin
    // exactly, so the port must not drift to 5174 when 5173 is busy.
    port: 5173,
    strictPort: true,
  },
});
