/**
 * GUARD: every /api/brain-ai/* route authenticates, and session ids are scoped
 * to their owner.
 *
 * Eight routes under app/api/brain-ai/ shipped with no authentication and were
 * live in production — verified 2026-08-11, an anonymous
 * `GET /api/brain-ai/session` answered 200. Three distinct exposures rode on
 * that: LLM spend (/execute), cross-tenant reads (/session, /transcript), and
 * SSRF (/ingest).
 *
 * The drift guard at the bottom is the load-bearing half of this file. Fixing
 * eight handlers once is easy; keeping the ninth from shipping without the
 * check is the actual problem, and only a test that reads the directory can do
 * that. It fails on any NEW route file that forgets the guard, which is exactly
 * how this cluster got into production in the first place.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { scopedSessionId, ownsSession } from '../route-guard';

// ── session scoping ─────────────────────────────────────────────────────────

describe('scopedSessionId namespaces a session to its owner', () => {
  it('prefixes with the server-resolved user id', () => {
    expect(scopedSessionId('user-1', 'abc')).toBe('u:user-1:abc');
  });

  it('gives two users different keys for the same raw id', () => {
    // This is the whole IDOR fix: the id a caller supplies cannot address
    // another caller's row, because the prefix is never read from the request.
    expect(scopedSessionId('user-1', 'shared')).not.toBe(scopedSessionId('user-2', 'shared'));
  });

  it('is deterministic, so a caller can re-address their own session', () => {
    expect(scopedSessionId('user-1', 'abc')).toBe(scopedSessionId('user-1', 'abc'));
  });
});

describe('ownsSession', () => {
  it('accepts a key minted for the same user', () => {
    expect(ownsSession('user-1', scopedSessionId('user-1', 'abc'))).toBe(true);
  });

  it('rejects another user’s key', () => {
    expect(ownsSession('user-2', scopedSessionId('user-1', 'abc'))).toBe(false);
  });

  it('rejects an unscoped legacy key', () => {
    // Pre-fix ids looked like `brain-1699...-x9f2`. They belong to nobody now.
    expect(ownsSession('user-1', 'brain-1699000000-x9f2')).toBe(false);
  });

  it('rejects a forged prefix that merely starts with the same characters', () => {
    // `u:user-10:` must not satisfy ownership for `user-1`.
    expect(ownsSession('user-1', 'u:user-10:abc')).toBe(false);
  });
});

// ── drift guard ─────────────────────────────────────────────────────────────

const ROUTES_DIR = join(process.cwd(), 'app/api/brain-ai');

function routeFiles(): string[] {
  if (!existsSync(ROUTES_DIR)) return [];
  return readdirSync(ROUTES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(ROUTES_DIR, e.name, 'route.ts'))
    .filter((p) => existsSync(p));
}

/** Strip comments so prose ABOUT the guard cannot satisfy the assertion. */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('every /api/brain-ai route is authenticated', () => {
  const files = routeFiles();

  it('finds the route files at all (a passing-because-empty suite is not a guard)', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  for (const file of files) {
    const name = file.split('/').slice(-2).join('/');

    it(`${name} imports the shared guard`, () => {
      expect(code(file)).toMatch(/from ['"]@\/lib\/brain-ai\/route-guard['"]/);
    });

    it(`${name} calls guardBrainAi in every exported handler`, () => {
      const src = code(file);
      // One call per exported HTTP verb — a file with GET and POST needs two.
      const handlers = src.match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g) ?? [];
      const guards = src.match(/guardBrainAi\s*\(/g) ?? [];
      expect(handlers.length).toBeGreaterThan(0);
      expect(guards.length).toBeGreaterThanOrEqual(handlers.length);
    });

    it(`${name} returns immediately when the guard blocks`, () => {
      // `const { blocked } = await guardBrainAi(...)` with no `return blocked`
      // authenticates and then carries on anyway — worse than no check, because
      // it reads as covered.
      expect(code(file)).toMatch(/if\s*\(\s*blocked\s*\)\s*return\s+blocked/);
    });
  }
});

describe('the session-listing branch stays deleted', () => {
  it('no brain-ai route calls listSessionIds', () => {
    // `GET /api/brain-ai/session` with no id returned every session id for
    // every user — an enumeration endpoint, not a guessing problem. There is no
    // safe version of it and nothing called it.
    for (const file of routeFiles()) {
      expect(code(file)).not.toMatch(/listSessionIds/);
    }
  });
});
