/**
 * Vercel Edge Function CORS & Header Proxy (/api/proxy)
 * Enables YouTube Music browsing, audio/Range streaming, Apple artwork, and
 * non-CORS lyric providers directly from iOS Safari, iPadOS, and desktop browsers
 * without needing a browser extension or separate Cloudflare Worker setup.
 */

export const config = {
  runtime: 'edge',
};

const EXACT_HOSTS = new Set([
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

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase();
  return EXACT_HOSTS.has(host) || host.endsWith('.googlevideo.com');
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Type, *',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

function applyUpstreamHeaders(target, incoming) {
  const headers = new Headers();
  for (const name of [
    'accept',
    'accept-language',
    'content-type',
    'range',
    'if-range',
    'x-goog-api-key',
    'x-goog-visitor-id',
    'x-youtube-client-name',
    'x-youtube-client-version',
  ]) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  headers.set(
    'User-Agent',
    incoming.get('x-user-agent') ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  );

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
    const auth = incoming.get('authorization');
    if (auth) headers.set('Authorization', auth);
  } else if (host === 'api-partner.spotify.com' || host === 'open.spotify.com') {
    headers.set('Origin', 'https://open.spotify.com');
    headers.set('Referer', 'https://open.spotify.com/');
    const auth = incoming.get('authorization');
    if (auth) headers.set('Authorization', auth);
    const platform = incoming.get('app-platform');
    if (platform) headers.set('App-Platform', platform);
  }

  return headers;
}

const RATE_WINDOW_MS = 60_000;
const MAX_API_REQS_PER_WINDOW = 120;
const MAX_MEDIA_REQS_PER_WINDOW = 240;
const MAX_RATE_BUCKETS = 2000;
const rateBuckets = new Map();

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'anonymous';
}

function checkRateLimit(request, isMedia) {
  const now = Date.now();
  if (rateBuckets.size > MAX_RATE_BUCKETS) {
    for (const [k, v] of rateBuckets) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
    if (rateBuckets.size > MAX_RATE_BUCKETS) rateBuckets.clear();
  }
  const limit = isMedia ? MAX_MEDIA_REQS_PER_WINDOW : MAX_API_REQS_PER_WINDOW;
  const key = `${getClientIp(request)}:${isMedia ? 'media' : 'api'}`;
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const resetSec = Math.ceil((bucket.resetAt - now) / 1000);
  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetSec,
  };
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const reqUrl = new URL(request.url);
  if (reqUrl.searchParams.get('health') === '1') {
    return json({ ok: true, service: 'isopod-vercel-edge-proxy' }, 200, request);
  }

  const rawTarget = reqUrl.searchParams.get('url');
  if (!rawTarget) {
    return json({ error: 'Missing ?url= parameter' }, 400, request);
  }

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    return json({ error: 'Invalid target URL' }, 400, request);
  }

  if (target.protocol !== 'https:' || !isAllowedHost(target.hostname)) {
    return json({ error: `Host not allowed: ${target.hostname}` }, 403, request);
  }

  const isMedia = request.headers.has('range') || target.hostname.toLowerCase().endsWith('.googlevideo.com');
  const rate = checkRateLimit(request, isMedia);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.', retryAfterSec: rate.resetSec }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rate.resetSec),
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rate.resetSec),
          ...corsHeaders(request),
        },
      },
    );
  }

  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'POST' && method !== 'HEAD') {
    return json({ error: `Method not allowed: ${method}` }, 405, request);
  }

  // Edge / Web Fetch rejects passing a ReadableStream body without `duplex: 'half'`,
  // so buffer POST payloads (Innertube JSON / search queries) cleanly first.
  const body = method === 'POST' ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(target.toString(), {
    method,
    headers: applyUpstreamHeaders(target, request.headers),
    body,
    redirect: 'follow',
  });

  const responseHeaders = new Headers(upstream.headers);
  if (upstream.headers.has('content-encoding')) {
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
  }
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    responseHeaders.set(key, value);
  }
  responseHeaders.delete('set-cookie');
  responseHeaders.delete('content-security-policy');
  responseHeaders.delete('x-frame-options');

  if (request.headers.has('range') || upstream.status === 206) {
    const buf = await upstream.arrayBuffer();
    responseHeaders.set('content-length', String(buf.byteLength));
    responseHeaders.set('accept-ranges', 'bytes');
    return new Response(buf, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
