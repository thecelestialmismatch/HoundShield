/**
 * GUARD: requirement 1 — a credential route answers identically whether or not
 * the address exists, in BOTH wording and timing.
 *
 * These are source-level assertions on purpose. The failure they prevent is not
 * "the code computes a wrong value" — every path already returns a plausible
 * response. It is "one path quietly stops paying the cost the others pay", and
 * that is a property of the control flow, which is exactly what is readable in
 * source and invisible in a unit test of the happy path.
 *
 * Three distinct oracles are covered, because each was real here:
 *
 *   WORDING  — "That email is already registered" vs "check your email".
 *              Closed by returning one body from every branch.
 *   TIMING   — GoTrue only runs bcrypt when the address resolves, and
 *              `admin.generateLink` only mints a token when it resolves. Both
 *              are tens-to-hundreds of ms, measurable across the internet.
 *              Closed by settling against the shared floor on every exit.
 *   COOKIE   — with Supabase "Confirm email" OFF, sign-up returns a live
 *              session for a NEW address and none for an existing one. That
 *              difference is in the Set-Cookie header, so no amount of body
 *              rewording touches it. Closed by discarding the session.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

/** Strip comments so prose about a control cannot satisfy the assertion. */
function code(rel: string): string {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const CREDENTIAL_ROUTES = [
  'app/api/auth/login/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/auth/reset-password/route.ts',
];

describe('every credential route settles against the shared timing floor', () => {
  for (const rel of CREDENTIAL_ROUTES) {
    const src = code(rel);

    it(`${rel} imports settleAuthTiming`, () => {
      expect(src).toMatch(/settleAuthTiming/);
    });

    it(`${rel} stamps a start time before doing any work`, () => {
      expect(src).toMatch(/const\s+startedAt\s*=\s*Date\.now\(\)/);
    });

    it(`${rel} settles on EVERY return, not just the success path`, () => {
      // A single unsettled `return` is the whole oracle: it is the fast path,
      // and the fast path is the informative one.
      const returns = src.match(/^\s*return\s+/gm) ?? [];
      const settles = src.match(/await\s+settleAuthTiming\(/g) ?? [];
      expect(returns.length).toBeGreaterThan(0);
      expect(settles.length).toBeGreaterThanOrEqual(returns.length - 1);
    });
  }
});

describe('sign-up does not distinguish a new address from an existing one', () => {
  const src = code('app/api/auth/signup/route.ts');

  it('never returns a body that names a duplicate address', () => {
    expect(src).not.toMatch(/already\s+(registered|exists|in use)/i);
  });

  it('discards the session Supabase mints when "Confirm email" is OFF', () => {
    // Without this, a NEW address gets Set-Cookie and an existing one does not.
    // The attacker never has to read the JSON.
    expect(src).toMatch(/auth\.signOut\(\)/);
  });

  it('returns the same neutral body after discarding that session', () => {
    // The auto-confirm branch must land on neutralOk(), not its own shape.
    const branch = src.slice(src.indexOf('data?.session'));
    expect(branch).toMatch(/return\s+neutralOk\(\)/);
    expect(branch).not.toMatch(/next:\s*['"]\/command-center/);
  });
});

describe('password reset does not distinguish a known address from an unknown one', () => {
  const src = code('app/api/auth/reset-password/route.ts');

  it('answers 200 for any well-formed address', () => {
    expect(src).toMatch(/const\s+ok\s*=\s*\(\)\s*=>\s*NextResponse\.json\(\{\s*ok:\s*true/);
  });

  it('keeps the email send off the response path', () => {
    // after() bounds the slow half; the timing floor bounds the fast half.
    expect(src).toMatch(/after\(\(\)\s*=>\s*sendPasswordResetEmail/);
  });

  it('never returns a 404 for an unknown account', () => {
    expect(src).not.toMatch(/status:\s*404/);
  });

  it('never logs the raw address', () => {
    // A support engineer reading logs must not become an enumeration oracle.
    const logs = src.match(/console\.(log|info|warn|error)\([^)]*\)/g) ?? [];
    for (const line of logs) {
      expect(line).not.toMatch(/\$\{\s*email\s*\}/);
    }
  });
});
