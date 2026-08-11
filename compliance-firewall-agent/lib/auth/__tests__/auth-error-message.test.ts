/**
 * The neutral-message contract.
 *
 * The property under test is not "does this return a nice string" — it is that
 * NO input produces an output an attacker can distinguish. That is asserted
 * structurally: every message the mapper can emit is enumerated, and the tests
 * prove the mapper's whole range is inside that set for a corpus of real GoTrue
 * and Better Auth error texts, including the ones that used to leak.
 */
import { describe, it, expect } from 'vitest';
import {
  AUTH_INVALID_CREDENTIALS,
  AUTH_RATE_LIMITED,
  AUTH_GENERIC_FAILURE,
  AUTH_CAPTCHA_REQUIRED,
  AUTH_SIGNUP_CHECK_EMAIL,
  lockedOutMessage,
  isThrottleError,
  signInErrorMessage,
  signUpErrorMessageNeutral,
} from '@/lib/auth/auth-error-message';

/**
 * The real GoTrue / Better Auth texts this app has surfaced or could surface.
 * The first two are the exact pair that made `/auth` an enumeration oracle:
 * "Email not confirmed" proves the account exists, "Invalid login credentials"
 * does not.
 */
const EXISTS_SIGNALS = [
  'Email not confirmed',
  'Invalid login credentials',
  'User already registered',
  'user already exists',
  'duplicate key value violates unique constraint "profiles_email_unique"',
  'Email address is already in use',
  'User not found',
  'Database error creating new user',
  'Password should be at least 6 characters',
  'Signups not allowed for this instance',
  'Anonymous sign-ins are disabled',
];

/** Shapes that once rendered as a literal "{}" in the signup banner. */
const JUNK_SHAPES: unknown[] = [
  null,
  undefined,
  {},
  [],
  '',
  '   ',
  '{}',
  '[object Object]',
  new Error(),
  new Error(''),
  { message: null },
  { message: undefined },
  { message: 123 },
  { message: '{}' },
  0,
  false,
];

describe('the message set is small, fixed, and human', () => {
  it('every constant is a usable sentence, not a token or an object', () => {
    const all = [
      AUTH_INVALID_CREDENTIALS,
      AUTH_RATE_LIMITED,
      AUTH_GENERIC_FAILURE,
      AUTH_CAPTCHA_REQUIRED,
      AUTH_SIGNUP_CHECK_EMAIL,
    ];
    for (const msg of all) {
      expect(msg.trim().length).toBeGreaterThan(20);
      expect(msg).not.toBe('{}');
      expect(msg.toLowerCase()).not.toContain('[object');
    }
  });

  it('no constant names a cause that would confirm an account exists', () => {
    const all = [
      AUTH_INVALID_CREDENTIALS,
      AUTH_RATE_LIMITED,
      AUTH_GENERIC_FAILURE,
      AUTH_CAPTCHA_REQUIRED,
      AUTH_SIGNUP_CHECK_EMAIL,
    ].join(' ')
      .toLowerCase();

    // Each of these appeared in a message this repo used to show.
    for (const leak of [
      'already registered',
      'already in use',
      'not confirmed',
      'no account',
      'account not found',
      'user not found',
      'unknown email',
      "doesn't exist",
      'does not exist',
      'wrong password',
      'incorrect password',
    ]) {
      expect(all).not.toContain(leak);
    }
  });
});

describe('signInErrorMessage — one answer for every failure', () => {
  it('collapses every non-throttle error to the same string', () => {
    const outputs = new Set(EXISTS_SIGNALS.map((m) => signInErrorMessage({ message: m })));
    expect(outputs).toEqual(new Set([AUTH_INVALID_CREDENTIALS]));
  });

  it('gives the same string for the enumerating pair that used to differ', () => {
    expect(signInErrorMessage({ message: 'Email not confirmed' })).toBe(
      signInErrorMessage({ message: 'Invalid login credentials' }),
    );
  });

  it('never echoes raw server text', () => {
    for (const raw of EXISTS_SIGNALS) {
      expect(signInErrorMessage({ message: raw })).not.toContain(raw);
      expect(signInErrorMessage(new Error(raw))).not.toContain(raw);
      expect(signInErrorMessage(raw)).not.toContain(raw);
    }
  });

  it('returns a human sentence for every junk shape', () => {
    for (const bad of JUNK_SHAPES) {
      const msg = signInErrorMessage(bad);
      expect(msg).toBe(AUTH_INVALID_CREDENTIALS);
      expect(msg.trim().length).toBeGreaterThan(20);
    }
  });

  it('distinguishes throttling only — the caller caused it and it proves nothing', () => {
    expect(signInErrorMessage({ message: 'Request rate limit reached' })).toBe(AUTH_RATE_LIMITED);
    expect(
      signInErrorMessage({ message: 'For security purposes, you can only request this after 45 seconds' }),
    ).toBe(AUTH_RATE_LIMITED);
    expect(signInErrorMessage({ message: 'over_email_send_rate_limit' })).toBe(AUTH_RATE_LIMITED);
  });

  it('has a range of exactly two strings', () => {
    const corpus = [...EXISTS_SIGNALS, ...JUNK_SHAPES, { message: 'rate limit' }, 'too many requests'];
    const range = new Set(corpus.map(signInErrorMessage));
    expect(range).toEqual(new Set([AUTH_INVALID_CREDENTIALS, AUTH_RATE_LIMITED]));
  });
});

describe('signUpErrorMessageNeutral — no already-registered branch exists', () => {
  it('answers a duplicate-email error exactly as it answers an unknown failure', () => {
    expect(signUpErrorMessageNeutral({ message: 'User already registered' })).toBe(
      signUpErrorMessageNeutral({ message: 'Database error creating new user' }),
    );
  });

  it('never says the email is taken', () => {
    for (const raw of EXISTS_SIGNALS) {
      const msg = signUpErrorMessageNeutral({ message: raw }).toLowerCase();
      expect(msg).not.toContain('already');
      expect(msg).not.toContain('registered');
      expect(msg).not.toContain('exists');
    }
  });

  it('has a range of exactly two strings', () => {
    const corpus = [...EXISTS_SIGNALS, ...JUNK_SHAPES, { message: 'too many attempts' }];
    const range = new Set(corpus.map(signUpErrorMessageNeutral));
    expect(range).toEqual(new Set([AUTH_GENERIC_FAILURE, AUTH_RATE_LIMITED]));
  });
});

describe('isThrottleError', () => {
  it('recognizes both providers’ throttle wording', () => {
    for (const m of [
      'Request rate limit reached',
      'Email rate limit exceeded',
      'too many requests',
      'For security purposes, you can only request this after 21 seconds',
      'over_email_send_rate_limit',
      'RATE LIMIT',
    ]) {
      expect(isThrottleError({ message: m })).toBe(true);
    }
  });

  it('does not mistake a credential failure for throttling', () => {
    for (const m of ['Invalid login credentials', 'Email not confirmed', 'User already registered']) {
      expect(isThrottleError({ message: m })).toBe(false);
    }
    for (const bad of JUNK_SHAPES) expect(isThrottleError(bad)).toBe(false);
  });
});

describe('lockedOutMessage', () => {
  it('rounds partial minutes up so the stated wait is never short', () => {
    expect(lockedOutMessage(14.2)).toContain('15 minutes');
    expect(lockedOutMessage(2.1)).toContain('3 minutes');
  });

  it('never says "0 minutes" — a floor of 1 keeps the instruction actionable', () => {
    expect(lockedOutMessage(0)).toContain('1 minute');
    expect(lockedOutMessage(-5)).toContain('1 minute');
  });

  it('agrees with itself on singular vs plural', () => {
    expect(lockedOutMessage(1)).toContain('1 minute,');
    expect(lockedOutMessage(2)).toContain('2 minutes,');
  });

  it('offers the recovery path, since a locked user cannot simply retry', () => {
    expect(lockedOutMessage(15).toLowerCase()).toContain('reset your password');
  });

  it('names no account, only the caller’s own behaviour', () => {
    const msg = lockedOutMessage(15).toLowerCase();
    expect(msg).toContain('failed sign-in attempts');
    expect(msg).not.toContain('account exists');
    expect(msg).not.toContain('registered');
  });
});
