import { getProxyUrl, proxiedUrl } from '@/lib/iosProxy';

export interface TranslateLanguage {
  code: string;
  label: string;
}

export const TRANSLATE_LANGUAGES: readonly TranslateLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'hinglish', label: 'Hinglish' },
];

const ITUNES_NS = 'http://music.apple.com/lyric-ttml-internal';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const TTML_NS = 'http://www.w3.org/ns/ttml';
const MAX_QUERY_CHARS = 1400;
const MAX_LINE_CACHE = 2000;
const MAX_DOC_CACHE = 60;

const lineCache = new Map<string, string>();
const docCache = new Map<string, string>();

function normalizeCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, ' ')
    .trim();
}

function isMeaningfulTranslation(source: string, translated: string | undefined): translated is string {
  if (!translated) return false;
  const srcNorm = normalizeCompare(source);
  const dstNorm = normalizeCompare(translated);
  return dstNorm.length > 0 && srcNorm !== dstNorm;
}

function setBounded<K, V>(map: Map<K, V>, key: K, value: V, limit: number): void {
  map.delete(key);
  map.set(key, value);
  if (map.size > limit) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
}

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'क़': 'q', 'ख़': 'kh',
  'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};

const DEVANAGARI_VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '',
};

/** Fallback Devanagari -> Roman Hinglish transliterator when Google dt=rm omits romanization. */
function devanagariToHinglish(text: string): string {
  if (!/[\u0900-\u097F]/.test(text)) return text;
  let out = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const next = chars[i + 1];
    if (DEVANAGARI_CONSONANTS[ch]) {
      out += DEVANAGARI_CONSONANTS[ch];
      if (!next || (!DEVANAGARI_MATRAS[next] && next !== '्' && /[\u0900-\u097F]/.test(next))) {
        out += 'a';
      }
    } else if (DEVANAGARI_VOWELS[ch]) {
      out += DEVANAGARI_VOWELS[ch];
    } else if (DEVANAGARI_MATRAS[ch] !== undefined) {
      out += DEVANAGARI_MATRAS[ch];
    } else {
      out += ch;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

async function fetchGoogleTranslateBatch(
  joinedText: string,
  targetLang: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const isHinglish = targetLang === 'hinglish';
  const tl = isHinglish ? 'hi' : targetLang;
  const endpoint =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto` +
    `&tl=${encodeURIComponent(tl)}&dt=t${isHinglish ? '&dt=rm' : ''}&q=${encodeURIComponent(joinedText)}`;

  const runFetch = async (url: string) => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Translate HTTP ${res.status}`);
    return res.json();
  };

  let data: unknown;
  try {
    data = await runFetch(endpoint);
  } catch (err) {
    if (signal?.aborted) throw err;
    const proxy = getProxyUrl();
    if (!proxy) throw err;
    data = await runFetch(proxiedUrl(endpoint));
  }

  const segments = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
  if (isHinglish) {
    const romanParts = segments
      .map((seg) => (Array.isArray(seg) && typeof seg[3] === 'string' ? seg[3] : ''))
      .filter(Boolean);
    if (romanParts.length > 0) {
      return romanParts.join('').split('\n');
    }
  }
  const full = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
    .join('');
  const lines = full.split('\n');
  return isHinglish ? lines.map(devanagariToHinglish) : lines;
}

/**
 * Translates an array of lyric lines to [targetLang] using batched requests,
 * preserving line alignment and filtering out no-op same-language lines.
 */
export async function translateTexts(
  texts: readonly string[],
  targetLang: string,
  signal?: AbortSignal,
): Promise<(string | undefined)[]> {
  const results: (string | undefined)[] = new Array(texts.length).fill(undefined);
  const missingByNormalizedText = new Map<string, number[]>();

  for (let i = 0; i < texts.length; i++) {
    const line = texts[i]?.replace(/\s+/g, ' ').trim() ?? '';
    if (!line) continue;
    const cacheKey = `${targetLang}\u0000${line}`;
    if (lineCache.has(cacheKey)) {
      const cached = lineCache.get(cacheKey)!;
      results[i] = isMeaningfulTranslation(line, cached) ? cached : undefined;
      continue;
    }
    const indices = missingByNormalizedText.get(line);
    if (indices) indices.push(i);
    else missingByNormalizedText.set(line, [i]);
  }

  const uniquePending = [...missingByNormalizedText.keys()];
  if (uniquePending.length === 0) return results;

  const batches: string[][] = [];
  let current: string[] = [];
  let currentEncodedLen = 0;

  for (const line of uniquePending) {
    const encodedLen = encodeURIComponent(line).length + 3;
    if (current.length > 0 && currentEncodedLen + encodedLen > MAX_QUERY_CHARS) {
      batches.push(current);
      current = [line];
      currentEncodedLen = encodedLen;
    } else {
      current.push(line);
      currentEncodedLen += encodedLen;
    }
  }
  if (current.length > 0) batches.push(current);

  for (const batch of batches) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    let translated = await fetchGoogleTranslateBatch(batch.join('\n'), targetLang, signal);
    // If Google merged or split newlines, translate line-by-line for this small batch so alignment stays 1:1
    if (translated.length !== batch.length && batch.length > 1) {
      translated = await Promise.all(
        batch.map(async (line) => {
          const single = await fetchGoogleTranslateBatch(line, targetLang, signal).catch(() => [line]);
          return single.join(' ').trim();
        }),
      );
    }
    for (let i = 0; i < batch.length; i++) {
      const src = batch[i]!;
      const dst = (translated[i] ?? '').trim();
      setBounded(lineCache, `${targetLang}\u0000${src}`, dst, MAX_LINE_CACHE);
      const out = isMeaningfulTranslation(src, dst) ? dst : undefined;
      for (const idx of missingByNormalizedText.get(src) ?? []) {
        results[idx] = out;
      }
    }
  }

  return results;
}

/**
 * Injects `<translations><translation>` metadata into a TTML document so
 * `<am-lyrics>` renders translated lines beneath each synced line.
 */
export function injectTtmlTranslations(
  ttml: string,
  translationsByParagraphIndex: readonly (string | undefined)[],
  targetLang: string,
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(ttml, 'application/xml');
  if (doc.querySelector('parsererror')) return ttml;

  const root = doc.documentElement;
  if (!root.getAttribute('xmlns:itunes')) {
    root.setAttribute('xmlns:itunes', ITUNES_NS);
  }

  const paragraphs = Array.from(doc.getElementsByTagName('p'));
  const entries: { key: string; text: string }[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]!;
    const translation = translationsByParagraphIndex[i]?.trim();
    if (!translation) continue;
    let key = p.getAttributeNS(ITUNES_NS, 'key') || p.getAttribute('itunes:key');
    if (!key) {
      key = `L${i + 1}`;
      p.setAttributeNS(ITUNES_NS, 'itunes:key', key);
    }
    entries.push({ key, text: translation });
  }

  if (entries.length === 0) return ttml;

  let head: Element | undefined = doc.getElementsByTagNameNS('*', 'head')[0];
  if (!head) {
    head = doc.createElementNS(root.namespaceURI || TTML_NS, 'head');
    root.insertBefore(head, root.firstChild);
  }

  let metadata: Element | undefined = head.getElementsByTagNameNS('*', 'metadata')[0];
  if (!metadata) {
    metadata = doc.createElementNS(root.namespaceURI || TTML_NS, 'metadata');
    head.appendChild(metadata);
  }

  // Replace any previously injected translation container for a clean update.
  for (const old of Array.from(metadata.getElementsByTagNameNS('*', 'translations'))) {
    old.parentNode?.removeChild(old);
  }

  const translationsEl = doc.createElementNS(ITUNES_NS, 'itunes:translations');
  const translationEl = doc.createElementNS(ITUNES_NS, 'translation');
  translationEl.setAttribute('type', 'subtitle');
  translationEl.setAttributeNS(XML_NS, 'xml:lang', targetLang === 'hinglish' ? 'hi-Latn' : targetLang);

  for (const { key, text } of entries) {
    const textEl = doc.createElementNS(ITUNES_NS, 'text');
    textEl.setAttribute('for', key);
    textEl.textContent = text;
    translationEl.appendChild(textEl);
  }

  translationsEl.appendChild(translationEl);
  metadata.appendChild(translationsEl);

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Translates every `<p>` line in [ttml] into [targetLang] and returns the
 * updated TTML document. Results are cached in memory per `(targetLang, ttml)`.
 */
export async function translateTtml(
  ttml: string,
  targetLang: string,
  signal?: AbortSignal,
): Promise<string> {
  const cacheKey = `${targetLang}\u0000${ttml}`;
  const cached = docCache.get(cacheKey);
  if (cached) return cached;

  const parser = new DOMParser();
  const doc = parser.parseFromString(ttml, 'application/xml');
  if (doc.querySelector('parsererror')) return ttml;

  const paragraphs = Array.from(doc.getElementsByTagName('p'));
  if (paragraphs.length === 0) return ttml;

  const lines = paragraphs.map((p) => (p.textContent ?? '').replace(/\s+/g, ' ').trim());
  const translated = await translateTexts(lines, targetLang, signal);
  const output = injectTtmlTranslations(ttml, translated, targetLang);
  setBounded(docCache, cacheKey, output, MAX_DOC_CACHE);
  return output;
}
