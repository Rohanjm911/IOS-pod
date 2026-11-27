import { describe, expect, it } from 'vitest';
import { ClientRateLimiter, RateLimitError } from './rateLimiter';

describe('ClientRateLimiter', () => {
  it('allows requests up to burst capacity and blocks excess', () => {
    const limiter = new ClientRateLimiter({
      search: { capacity: 3, refillPerSec: 1 },
    });

    const t0 = 10_000;
    expect(limiter.consume('search', t0).allowed).toBe(true);
    expect(limiter.consume('search', t0).allowed).toBe(true);
    expect(limiter.consume('search', t0).allowed).toBe(true);

    const blocked = limiter.consume('search', t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('refills tokens over time', () => {
    const limiter = new ClientRateLimiter({
      search: { capacity: 2, refillPerSec: 2 },
    });

    const t0 = 10_000;
    expect(limiter.consume('search', t0).allowed).toBe(true);
    expect(limiter.consume('search', t0).allowed).toBe(true);
    expect(limiter.consume('search', t0).allowed).toBe(false);

    // 1 second later -> 2 tokens refilled
    expect(limiter.consume('search', t0 + 1000).allowed).toBe(true);
  });

  it('enforces explicit 429 Retry-After backoff cooldown', async () => {
    const limiter = new ClientRateLimiter({
      api: { capacity: 10, refillPerSec: 5 },
    });

    const t0 = 20_000;
    limiter.backoff('api', 5, t0);
    const check = limiter.consume('api', t0 + 1000);
    expect(check.allowed).toBe(false);
    expect(check.retryAfterMs).toBe(4000);

    // acquire() throws RateLimitError if real-clock cooldown exceeds maxWaitMs
    limiter.backoff('api', 5);
    await expect(limiter.acquire('api', 50)).rejects.toBeInstanceOf(RateLimitError);
  });
});
