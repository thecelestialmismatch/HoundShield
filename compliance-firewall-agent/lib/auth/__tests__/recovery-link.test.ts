import { describe, it, expect } from 'vitest';
import { recoveryRequestSchema, buildRecoveryConfirmUrl } from '../recovery-link';

describe('recoveryRequestSchema', () => {
  it('accepts and normalizes a valid email (trim + lowercase)', () => {
    const r = recoveryRequestSchema.safeParse({ email: '  User@Acme.COM ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('user@acme.com');
  });

  it('rejects a malformed email', () => {
    expect(recoveryRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(recoveryRequestSchema.safeParse({ email: '' }).success).toBe(false);
    expect(recoveryRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('buildRecoveryConfirmUrl', () => {
  it('builds a same-origin /auth/confirm recovery link with the token hash', () => {
    const url = buildRecoveryConfirmUrl('https://www.houndshield.com', 'abc123');
    const u = new URL(url);
    expect(u.origin).toBe('https://www.houndshield.com');
    expect(u.pathname).toBe('/auth/confirm');
    expect(u.searchParams.get('token_hash')).toBe('abc123');
    expect(u.searchParams.get('type')).toBe('recovery');
    expect(u.searchParams.get('next')).toBe('/reset-password');
  });

  it('url-encodes a token hash containing reserved characters', () => {
    const url = buildRecoveryConfirmUrl('https://x.com', 'a b/c?d&e');
    const u = new URL(url);
    // Round-trips exactly — no truncation at & or ?.
    expect(u.searchParams.get('token_hash')).toBe('a b/c?d&e');
  });

  it('honours the provided base origin (never a request host header)', () => {
    expect(buildRecoveryConfirmUrl('http://localhost:3000', 't').startsWith('http://localhost:3000/auth/confirm')).toBe(true);
  });
});
