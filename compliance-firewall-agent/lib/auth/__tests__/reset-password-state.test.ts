import { describe, it, expect } from 'vitest';
import { resetView } from '../reset-password-state';

describe('resetView — Better Auth (token) mode', () => {
  it('shows the form with a valid token and no error', () => {
    expect(
      resetView({ betterAuth: true, token: 'abc', tokenError: null, sessionReady: null }),
    ).toBe('form');
  });

  it('is invalid with no token', () => {
    expect(
      resetView({ betterAuth: true, token: '', tokenError: null, sessionReady: null }),
    ).toBe('invalid');
  });

  it('is invalid when the link carries an error', () => {
    expect(
      resetView({ betterAuth: true, token: 'abc', tokenError: 'INVALID_TOKEN', sessionReady: true }),
    ).toBe('invalid');
  });
});

describe('resetView — Supabase (recovery session) mode', () => {
  it('shows a spinner while the session is still resolving', () => {
    expect(
      resetView({ betterAuth: false, token: '', tokenError: null, sessionReady: null }),
    ).toBe('loading');
  });

  it('shows the form once a recovery session exists — even with NO token', () => {
    // This is the regression: Supabase reset links carry no ?token=.
    expect(
      resetView({ betterAuth: false, token: '', tokenError: null, sessionReady: true }),
    ).toBe('form');
  });

  it('is invalid when there is no recovery session', () => {
    expect(
      resetView({ betterAuth: false, token: '', tokenError: null, sessionReady: false }),
    ).toBe('invalid');
  });

  it('ignores a stray token/error in Supabase mode (session is the source of truth)', () => {
    expect(
      resetView({ betterAuth: false, token: 'x', tokenError: 'INVALID_TOKEN', sessionReady: true }),
    ).toBe('form');
  });
});
