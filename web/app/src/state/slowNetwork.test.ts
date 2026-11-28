// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { isConnectionSlow, NETWORK_JOKES, OFFLINE_JOKES, pickRandomNetworkJoke, pickRandomOfflineJoke } from './slowNetwork';

describe('slowNetwork joke monitor', () => {
  it('detects only very slow connections via NetworkInformation thresholds', () => {
    expect(isConnectionSlow({ effectiveType: '2g' })).toBe(true);
    expect(isConnectionSlow({ effectiveType: 'slow-2g' })).toBe(true);
    expect(isConnectionSlow({ effectiveType: '4g', downlink: 0.3 })).toBe(true);
    expect(isConnectionSlow({ effectiveType: '4g', downlink: 10, rtt: 1600 })).toBe(true);
    expect(isConnectionSlow({ effectiveType: '3g', downlink: 1.0, rtt: 400 })).toBe(false);
    expect(isConnectionSlow({ effectiveType: '4g', downlink: 25, rtt: 40 })).toBe(false);
  });

  it('picks a random network joke without repeating the immediate previous joke', () => {
    expect(NETWORK_JOKES.length).toBeGreaterThanOrEqual(8);
    const first = pickRandomNetworkJoke();
    const second = pickRandomNetworkJoke();
    expect(first).not.toBe(second);
  });

  it('picks a random offline joke without repeating the immediate previous joke', () => {
    expect(OFFLINE_JOKES.length).toBeGreaterThanOrEqual(8);
    const first = pickRandomOfflineJoke();
    const second = pickRandomOfflineJoke();
    expect(first).not.toBe(second);
  });
});
