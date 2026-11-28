// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { line } from './model';
import { writeTtml } from './ttml';
import { injectTtmlTranslations, translateTexts, translateTtml } from './translate';

describe('lyrics translate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('batches texts, keeps non-empty translations, and drops empty lines', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([[['Hello world\n', 'Bonjour le monde\n', null, null], ['Same line', 'Same line', null, null]]]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const out = await translateTexts(['Bonjour le monde', '', 'Same line'], 'en');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(out[0]).toBe('Hello world');
    expect(out[1]).toBeUndefined();
    expect(out[2]).toBeUndefined();
  });

  it('filters identical translations when source matches target language', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([[['Never gonna give you up\n', 'Never gonna give you up\n'], ['नमस्ते दुनिया', 'Hello world']]]), {
        status: 200,
      }),
    );

    const out = await translateTexts(['Never gonna give you up', 'Hello world'], 'hi');
    expect(out[0]).toBeUndefined();
    expect(out[1]).toBe('नमस्ते दुनिया');
  });

  it('supports Hinglish romanized translation and falls back when dt=rm is absent', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          [
            ['मैं तुम्हारा इंतज़ार कर रहा हूँ', 'I am waiting for you', null, null],
            [null, null, null, 'Main tumhara intezar kar raha hoon'],
          ],
        ]),
        { status: 200 },
      ),
    );

    const out = await translateTexts(['I am waiting for you'], 'hinglish');
    expect(out[0]).toBe('Main tumhara intezar kar raha hoon');
  });

  it('injects matching itunes:key and <translation><text for="..."> into TTML', async () => {
    const ttml = writeTtml([line(1000, 'Tere bina'), line(3000, 'Zindagi se')]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([[['Without you\n', 'Tere bina\n'], ['From life', 'Zindagi se']]]), { status: 200 }),
    );

    const translatedXml = await translateTtml(ttml, 'en');
    const doc = new DOMParser().parseFromString(translatedXml, 'application/xml');
    const paragraphs = Array.from(doc.getElementsByTagName('p'));
    const texts = Array.from(doc.getElementsByTagName('translation')[0]!.getElementsByTagName('text'));

    expect(paragraphs.length).toBe(2);
    expect(texts.length).toBe(2);
    expect(paragraphs[0]!.getAttribute('itunes:key')).toBe('L1');
    expect(texts[0]!.getAttribute('for')).toBe('L1');
    expect(texts[0]!.textContent).toBe('Without you');
    expect(paragraphs[1]!.getAttribute('itunes:key')).toBe('L2');
    expect(texts[1]!.getAttribute('for')).toBe('L2');
    expect(texts[1]!.textContent).toBe('From life');
  });

  it('preserves existing Apple itunes:key attributes when injecting translations', () => {
    const appleTtml =
      `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:itunes="http://music.apple.com/lyric-ttml-internal">` +
      `<head><metadata/></head><body><div><p begin="1.0" end="2.0" itunes:key="L99">Hola</p></div></body></tt>`;
    const updated = injectTtmlTranslations(appleTtml, ['Hello'], 'en');
    const doc = new DOMParser().parseFromString(updated, 'application/xml');
    const textEl = doc.getElementsByTagName('translation')[0]!.getElementsByTagName('text')[0]!;
    expect(doc.getElementsByTagName('p')[0]!.getAttribute('itunes:key')).toBe('L99');
    expect(textEl.getAttribute('for')).toBe('L99');
    expect(textEl.textContent).toBe('Hello');
  });
});
