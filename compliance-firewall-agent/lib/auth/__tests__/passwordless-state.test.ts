import { describe, it, expect } from 'vitest';
import { isRateLimitError, supabaseOtpErrorMessage } from '../passwordless-state';

describe('isRateLimitError', () => {
  it('flags Supabase throttle messages', () => {
    expect(isRateLimitError('Email rate limit exceeded')).toBe(true);
    expect(isRateLimitError('For security purposes, you can only request this after 47 seconds')).toBe(true);
    expect(isRateLimitError('Too many requests')).toBe(true);
  });

  it('does not flag other errors', () => {
    expect(isRateLimitError('Token has expired or is invalid')).toBe(false);
    expect(isRateLimitError('')).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});

describe('supabaseOtpErrorMessage', () => {
  it('maps rate-limit before anything else', () => {
    expect(supabaseOtpErrorMessage('Email rate limit exceeded')).toMatch(/too many requests/i);
  });

  it('maps invalid/expired codes to one friendly line', () => {
    expect(supabaseOtpErrorMessage('Token has expired or is invalid')).toMatch(/invalid or has expired/i);
    expect(supabaseOtpErrorMessage('Invalid OTP')).toMatch(/invalid or has expired/i);
  });

  it('never echoes raw server text for unknown errors', () => {
    const raw = 'PGRST500: internal boom at auth.users';
    const out = supabaseOtpErrorMessage(raw);
    expect(out).not.toContain(raw);
    expect(out).toMatch(/request a new one/i);
  });
});
