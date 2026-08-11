/**
 * GUARD: an unverified address must never hold a live session.
 *
 * Better Auth shipped with `requireEmailVerification: false` and
 * `sendOnSignUp: false` — dormant today (the provider is gated on
 * AUTH_PROVIDER=better-auth) but loaded for the day it flips. With those
 * defaults anyone could sign up as someone@customer.gov and the product would
 * treat them as that person. For a tool sold as audit evidence, an unverified
 * identity in the session is a defect in the evidence.
 *
 * WHY THIS READS SOURCE RATHER THAN CALLING betterAuth(). Building the instance
 * opens a `pg.Pool`, so a behavioural test would need a live Postgres and would
 * be skipped in CI — a guard that does not run is not a guard. The two flags are
 * plain literals in a config object, so asserting the source text is exact,
 * cheap, and cannot be satisfied by accident.
 *
 * BOTH flags are asserted together on purpose. `requireEmailVerification: true`
 * with `sendOnSignUp: false` is worse than either default alone: no verification
 * mail is ever sent, so every new user is locked out of an account they can
 * never activate.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = readFileSync(join(process.cwd(), 'lib/auth/better-auth.ts'), 'utf8');

/** Strip comments so prose about a flag cannot satisfy — or trip — the guard. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('Better Auth requires proven email ownership', () => {
  it('sets requireEmailVerification: true', () => {
    expect(CODE).toMatch(/requireEmailVerification:\s*true/);
  });

  it('never sets requireEmailVerification: false', () => {
    expect(CODE).not.toMatch(/requireEmailVerification:\s*false/);
  });

  it('sets sendOnSignUp: true, or verification mail is never sent', () => {
    expect(CODE).toMatch(/sendOnSignUp:\s*true/);
  });

  it('never sets sendOnSignUp: false', () => {
    expect(CODE).not.toMatch(/sendOnSignUp:\s*false/);
  });

  it('wires a sendVerificationEmail handler, so the flags are not decorative', () => {
    expect(CODE).toMatch(/sendVerificationEmail:/);
  });

  it('keeps a minimum password length', () => {
    const match = CODE.match(/minPasswordLength:\s*(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(8);
  });

  it('does not skip 2FA verification on enable — never lock an account behind an unproven factor', () => {
    expect(CODE).not.toMatch(/skipVerificationOnEnable:\s*true/);
  });
});
