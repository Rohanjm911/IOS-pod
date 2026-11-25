import type { Innertube, Types } from 'youtubei.js/web';
import { getBridge } from '@/extension/bridge';
import { ensureYtAuth, identityOf, noteMusicIdentity } from '@/extension/useYtAuth';
import { getProxyUrl, proxiedUrl } from '@/lib/iosProxy';
import { trackLog } from '../trackLog';

/**
 * The page's YouTube.js instance, created on first use (YouTube.js is large,
 * prompt §3). All of its requests leave from the browser itself; the
 * extension's declarativeNetRequest rules supply the YouTube headers
 * (web/extension/lib/rules.ts).
 */
let instance: Promise<Innertube> | null = null;
let browseInstance: Promise<Innertube> | null = null;

export function getInnertube(): Promise<Innertube> {
  instance ??= create(simpleRequestFetch, true).catch((error: unknown) => {
    instance = null;
    throw error;
  });
  return instance;
}

/** Fast InnerTube client for search, suggestions, and browse (skips downloading the 2.5 MB player JS). */
export function getBrowseInnertube(): Promise<Innertube> {
  if (instance) return instance;
  browseInstance ??= create(simpleRequestFetch, false)
    .then((yt) => {
      if (typeof window !== 'undefined') {
        setTimeout(() => void getInnertube().catch(() => undefined), 1500);
      }
      return yt;
    })
    .catch((error: unknown) => {
      browseInstance = null;
      throw error;
    });
  return browseInstance;
}

/**
 * A second instance for signed-in requests (prompt §5.3). Its InnerTube calls
 * go through the extension (`yt.fetch` with `auth`), which adds the user's
 * session; everything else (the session bootstrap, the player script) loads
 * like the anonymous instance's. The page never holds a cookie, so YouTube.js
 * is told it is signed in rather than given one.
 */
let signedInstance: Promise<Innertube> | null = null;
let signedBrowseInstance: Promise<Innertube> | null = null;

export function getSignedInnertube(): Promise<Innertube> {
  signedInstance ??= create(signedFetch, true).then(
    (yt) => {
      // Lifts YouTube.js's "must be signed in" checks (library pages). With
      // no cookie and no OAuth token it adds no credentials of its own.
      yt.session.logged_in = true;
      return yt;
    },
    (error: unknown) => {
      signedInstance = null;
      throw error;
    },
  );
  return signedInstance;
}

/** Fast signed-in InnerTube client for browse/search without downloading the player script upfront. */
export function getSignedBrowseInnertube(): Promise<Innertube> {
  if (signedInstance) return signedInstance;
  signedBrowseInstance ??= create(signedFetch, false).then(
    (yt) => {
      yt.session.logged_in = true;
      return yt;
    },
    (error: unknown) => {
      signedBrowseInstance = null;
      throw error;
    },
  );
  return signedBrowseInstance;
}

/** The instance browse/search requests should use: fast (no player script download), signed in when available. */
export async function getMusicClient(): Promise<Innertube> {
  const auth = await ensureYtAuth().catch(() => null);
  // A failed auth read browses anonymously, and says so, so the answer that
  // does come later reloads what was read meanwhile (useYtAuth.adopt).
  noteMusicIdentity(auth ? identityOf(auth) : 'anonymous');
  return auth?.signedIn ? getSignedBrowseInnertube() : getBrowseInnertube();
}

const YOUTUBE_HOSTS = new Set(['music.youtube.com', 'www.youtube.com', 'youtube.com']);

/** Headers a page may send without triggering a CORS preflight. */
const SAFELISTED = new Set(['accept', 'accept-language', 'content-language']);

/** Resolves relative or absolute fetch inputs safely against the page origin. */
function toUrl(input: RequestInfo | URL): URL {
  const raw = input instanceof Request ? input.url : input.toString();
  const base = typeof location !== 'undefined' ? location.origin : 'https://localhost';
  return new URL(raw, base);
}

/**
 * youtubei answers CORS preflights with 400 (measured; web/fixtures/README.md),
 * so InnerTube calls must be "simple" requests: a text/plain body and no
 * custom headers. youtubei parses the JSON body regardless of the declared
 * type, and everything the dropped headers carried (client name and version,
 * visitor data) is also in the body's `context.client`. Origin, Referer and
 * X-Origin are added by the extension's rule.
 */
async function simpleRequestFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const rawUrl = toUrl(input);

  if (!YOUTUBE_HOSTS.has(rawUrl.hostname) || rawUrl.pathname.startsWith('/api/jnn/')) {
    return fetch(input, init);
  }

  const targetUrl = !getBridge() && getProxyUrl() ? toUrl(proxiedUrl(rawUrl.toString())) : rawUrl;
  const method = init?.method ?? request?.method ?? 'GET';
  const source = new Headers(init?.headers ?? request?.headers);
  const headers = new Headers();
  source.forEach((value, key) => {
    if (SAFELISTED.has(key.toLowerCase())) headers.set(key, value);
  });

  let body: BodyInit | null | undefined = init?.body;
  if (body === undefined && request && method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
  }
  if (body != null) headers.set('Content-Type', 'text/plain;charset=UTF-8');

  return fetch(targetUrl, {
    method,
    headers,
    body: body ?? null,
    signal: init?.signal ?? request?.signal ?? null,
    // Anonymous: the user's YouTube cookies never ride along on page requests.
    credentials: 'omit',
  });
}

function isInnertubeCall(url: URL): boolean {
  return (url.hostname === 'music.youtube.com' || url.hostname === 'www.youtube.com') && url.pathname.startsWith('/youtubei/');
}

function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/** InnerTube calls through the extension, signed as the chosen channel; the rest as simpleRequestFetch. */
async function signedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const url = toUrl(input);
  if (!isInnertubeCall(url)) return simpleRequestFetch(input, init);

  const bridge = getBridge();
  if (!bridge) throw new Error('Signed-in requests need the BitChord extension');
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase() as 'GET' | 'POST';
  const headers: Record<string, string> = {};
  new Headers(init?.headers ?? request?.headers).forEach((value, key) => (headers[key] = value));
  let body = init?.body ?? undefined;
  if (body === undefined && request && method !== 'GET') body = await request.text();
  if (body != null && typeof body !== 'string') body = await new Response(body).text();

  const response = await bridge.call(
    'yt.fetch',
    { url: url.toString(), method, headers, ...(typeof body === 'string' && { body }), auth: true },
    { ...(init?.signal && { signal: init.signal }) },
  );
  const payload = response.bodyEncoding === 'base64' ? decodeBase64(response.body) : response.body;
  return new Response(response.status === 204 || response.status === 304 ? null : payload, {
    status: response.status,
    headers: response.headers,
  });
}

async function isFirstRun(): Promise<boolean> {
  try {
    const databases = await indexedDB.databases();
    return !databases.some((db) => db.name === 'youtubei.js');
  } catch {
    return true;
  }
}

async function create(
  fetch: typeof globalThis.fetch = simpleRequestFetch,
  retrievePlayer = true,
): Promise<Innertube> {
  const started = performance.now();
  const { Innertube, Platform, UniversalCache } = await import('youtubei.js/web');

  if (retrievePlayer) {
    // Runs the player's signature and n-parameter functions, which YouTube.js
    // extracts from YouTube's player script (as Kira does).
    Platform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
      const properties: string[] = [];
      if (env.n) properties.push(`n: exportedVars.nFunction(${JSON.stringify(env.n)})`);
      if (env.sig) properties.push(`sig: exportedVars.sigFunction(${JSON.stringify(env.sig)})`);
      return new Function(`${data.output}\nreturn { ${properties.join(', ')} }`)();
    };
  }

  const firstRun = await isFirstRun();
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(true),
      fetch,
      retrieve_player: retrievePlayer,
    });
    const client = yt.session.context.client;
    trackLog.i(
      `InnerTube ready in ${Math.round(performance.now() - started)}ms ` +
        `(${client.clientName} ${client.clientVersion}, player ${yt.session.player?.player_id ?? 'skipped'})`,
    );
    return yt;
  } catch (error) {
    // YouTube.js falls back to a locally generated session when /sw.js_data
    // fails on the very first run, and those sessions fail playback later.
    // Dropping its cache makes the next start retry for real (Kira does this).
    if (firstRun) indexedDB.deleteDatabase('youtubei.js');
    trackLog.e(`InnerTube failed to start: ${String(error)}`);
    throw error;
  }
}
