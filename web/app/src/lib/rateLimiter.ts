/**
 * Client-side token-bucket + cooldown rate limiter for BitChord API calls.
 * Prevents request bursts from hammering YouTube, Audius, iTunes, or `/api/proxy`,
 * and respects server `429 Retry-After` cooldowns.
 */

export interface RateLimitRule {
  /** Maximum burst tokens in the bucket. */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSec: number;
}

interface BucketState {
  tokens: number;
  lastRefillMs: number;
  blockedUntilMs: number;
}

const DEFAULT_RULES: Record<string, RateLimitRule> = {
  search: { capacity: 15, refillPerSec: 3 },
  external: { capacity: 20, refillPerSec: 4 },
  api: { capacity: 45, refillPerSec: 8 },
};

export class RateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(bucket: string, retryAfterMs: number) {
    super(`Rate limit exceeded for "${bucket}". Retry in ${Math.ceil(retryAfterMs / 1000)}s.`);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class ClientRateLimiter {
  private readonly buckets = new Map<string, BucketState>();
  private readonly rules: Record<string, RateLimitRule>;

  constructor(rules: Record<string, RateLimitRule> = DEFAULT_RULES) {
    this.rules = rules;
  }

  private ruleFor(name: string): RateLimitRule {
    return this.rules[name] ?? { capacity: 30, refillPerSec: 5 };
  }

  private refill(name: string, now = Date.now()): BucketState {
    const rule = this.ruleFor(name);
    let state = this.buckets.get(name);
    if (!state) {
      state = { tokens: rule.capacity, lastRefillMs: now, blockedUntilMs: 0 };
      this.buckets.set(name, state);
      return state;
    }
    const elapsedSec = Math.max(0, (now - state.lastRefillMs) / 1000);
    if (elapsedSec > 0) {
      state.tokens = Math.min(rule.capacity, state.tokens + elapsedSec * rule.refillPerSec);
      state.lastRefillMs = now;
    }
    return state;
  }

  /** Try to consume 1 token from `bucket`; returns `{ allowed, remaining, retryAfterMs }`. */
  consume(bucket: string, now = Date.now()): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const rule = this.ruleFor(bucket);
    const state = this.refill(bucket, now);

    if (state.blockedUntilMs > now) {
      return { allowed: false, remaining: 0, retryAfterMs: state.blockedUntilMs - now };
    }

    if (state.tokens >= 1) {
      state.tokens -= 1;
      return { allowed: true, remaining: Math.floor(state.tokens), retryAfterMs: 0 };
    }

    const waitMs = Math.ceil(((1 - state.tokens) / rule.refillPerSec) * 1000);
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(100, waitMs) };
  }

  /** Apply an explicit server `429 Retry-After` cooldown to a bucket. */
  backoff(bucket: string, retryAfterSec = 5, now = Date.now()): void {
    const state = this.refill(bucket, now);
    state.tokens = 0;
    state.blockedUntilMs = Math.max(state.blockedUntilMs, now + Math.max(1, retryAfterSec) * 1000);
  }

  /** Wait briefly if rate-limited (up to `maxWaitMs`), or throw `RateLimitError`. */
  async acquire(bucket: string, maxWaitMs = 1500): Promise<void> {
    const check = this.consume(bucket);
    if (check.allowed) return;
    if (check.retryAfterMs > maxWaitMs) {
      throw new RateLimitError(bucket, check.retryAfterMs);
    }
    await new Promise((r) => setTimeout(r, check.retryAfterMs));
    const retry = this.consume(bucket);
    if (!retry.allowed) {
      throw new RateLimitError(bucket, retry.retryAfterMs);
    }
  }

  reset(): void {
    this.buckets.clear();
  }
}

export const siteRateLimiter = new ClientRateLimiter();
