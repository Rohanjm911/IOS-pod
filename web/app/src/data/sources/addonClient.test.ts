import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAddonQueryParams, matchTier, probeAddon, resolveAddonStream, type AddonSourceConfig } from './addonClient';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('addonClient', () => {
  it('matches closest quality option for tier', () => {
    const options = [
      { value: 'low', label: 'AAC 96kbps' },
      { value: 'high', label: '320kbps' },
      { value: 'flac', label: 'FLAC Lossless' },
    ];
    expect(matchTier(options, 'LOSSLESS')).toBe('flac');
    expect(matchTier(options, 'HIGH')).toBe('high');
    expect(matchTier(options, 'LOW')).toBe('low');
  });

  it('builds query params from manifest defaults and quality tier', () => {
    const params = buildAddonQueryParams(
      {
        id: 'tidal-mod',
        name: 'Tidal Module',
        version: '1.2.0',
        resources: ['search'],
        settings: [
          { key: 'quality', default: 'high', options: [{ value: 'high' }, { value: 'lossless' }] },
          { key: 'country', default: 'US' },
        ],
      },
      'LOSSLESS',
    );
    expect(params.get('quality')).toBe('lossless');
    expect(params.get('country')).toBe('US');
  });

  it('probes manifest.json and falls back to /search when manifest is omitted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/manifest.json')) return new Response('Not found', { status: 404 });
        return new Response(JSON.stringify({ tracks: [] }), { status: 200 });
      }),
    );

    const probed = await probeAddon('https://addon.example.com/');
    expect(probed.url).toBe('https://addon.example.com');
    expect(probed.manifest.resources).toEqual(['search']);
  });

  it('resolves best matching non-encrypted FLAC stream and skips unsupported codecs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/search?')) {
          return new Response(
            JSON.stringify({
              tracks: [
                { id: 'dsd-1', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, format: 'DSD' },
                { id: 'flac-1', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, format: 'FLAC' },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({ url: 'https://cdn.example.com/track.flac', codec: 'FLAC', sampleRate: 44100, bitDepth: 16 }),
          { status: 200 },
        );
      }),
    );

    const addon: AddonSourceConfig = {
      id: 'hires',
      url: 'https://hires.example.com',
      name: 'HiRes Source',
      version: '1.0.0',
      enabled: true,
      manifest: { id: 'hires', name: 'HiRes Source', version: '1.0.0', resources: ['search'], settings: [] },
      lastError: null,
    };

    const resolved = await resolveAddonStream(addon, { title: 'Blinding Lights', artist: 'The Weeknd', durationSec: 200 }, 'LOSSLESS', true);
    expect(resolved?.kind).toBe('url');
    expect(resolved?.value).toBe('https://cdn.example.com/track.flac');
    expect(resolved?.codec).toBe('FLAC');
  });
});
