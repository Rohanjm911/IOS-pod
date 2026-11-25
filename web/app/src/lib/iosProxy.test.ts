import { describe, expect, it } from 'vitest';
import { isProxyableUrl, proxiedUrl, setProxyUrl } from './iosProxy';

describe('iosProxy', () => {
  it('always produces an absolute URL parseable by new URL() even for relative /api/proxy bases', () => {
    setProxyUrl('/api/proxy');
    const target = 'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false';
    expect(isProxyableUrl(target)).toBe(true);
    const wrapped = proxiedUrl(target);
    expect(() => new URL(wrapped)).not.toThrow();
    const parsed = new URL(wrapped);
    expect(parsed.pathname).toBe('/api/proxy');
    expect(parsed.searchParams.get('url')).toBe(target);
    expect(proxiedUrl(wrapped)).toBe(wrapped);
  });
});
