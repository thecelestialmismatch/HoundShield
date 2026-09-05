#!/usr/bin/env node
/**
 * The production-dependency security gate, with one thing added that the bare
 * `npm audit --omit=dev --audit-level=high` could not do: tell a REGISTRY
 * OUTAGE apart from a REAL VULNERABILITY.
 *
 * WHY THIS EXISTS. On 2026-09-03 the npm advisory endpoint returned 503 for
 * several minutes and this job went red on three unrelated branches at 22:19,
 * 22:38 and 22:47 — including the commit that was merged to main:
 *
 *   npm warn audit 503 Service Unavailable - POST
 *     https://registry.npmjs.org/-/npm/v1/security/audits/quick
 *   npm error audit endpoint returned an error
 *
 * `npm audit` exits 1 for a transport failure and exits 1 for a high-severity
 * finding, with no way for the caller to distinguish them. So a security gate
 * that is supposed to mean "no known high advisories in production deps"
 * silently also meant "npm's API answered". Both readings are red, and the
 * only way to tell which is to open the log — which is exactly how a gate
 * teaches people to ignore it, and this repository has already recorded that
 * failure once (`.github/workflows/security-audit.yml`: a wrapper that made
 * the job incapable of failing, whose green check was then read as evidence
 * of a clean baseline it did not have).
 *
 * WHAT IT DOES NOT DO. It does not pass when the security state is unknown.
 * A security control that goes green because it could not perform the check
 * is strictly worse than no control, and is the same mistake as the wrapper.
 * An unreachable registry still FAILS the job — it just says so in one line
 * instead of hiding it under seven minutes of retry noise.
 *
 * Usage: node scripts/npm-audit-gate.mjs [--level=high] [--attempts=4]
 * Run from the package directory (the workflow sets working-directory).
 */
import { spawnSync } from 'node:child_process';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const LEVEL = arg('level', 'high');
const ATTEMPTS = Math.max(1, Number.parseInt(arg('attempts', '4'), 10) || 4);
/** Backoff between attempts, ms. A registry 503 clears in seconds, not hours. */
const BACKOFF_MS = [0, 5000, 15000, 30000];

/**
 * npm reports a transport/service failure as a JSON document whose top level
 * is an `error` object, rather than the usual `vulnerabilities` + `metadata`
 * report. That shape is the discriminator — not the exit code, which is 1
 * either way, and not stderr text, which is not a stable contract.
 */
function classify(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { kind: 'unparseable' };
  }
  if (parsed && typeof parsed === 'object' && parsed.error) {
    return { kind: 'registry_error', detail: parsed.error };
  }
  if (parsed && typeof parsed === 'object' && parsed.metadata) {
    return { kind: 'report', report: parsed };
  }
  return { kind: 'unparseable' };
}

/** Count findings at or above the gate level, from the audit report. */
function countAtOrAbove(report, level) {
  const order = ['info', 'low', 'moderate', 'high', 'critical'];
  const floor = order.indexOf(level);
  const found = report?.metadata?.vulnerabilities ?? {};
  return order
    .slice(floor === -1 ? 3 : floor)
    .reduce((sum, sev) => sum + (found[sev] ?? 0), 0);
}

function sleep(ms) {
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

let last = null;
for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
  sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);

  // --json so the outcome is parseable. The level is applied by this script
  // from the report, so the exit code is not the thing being interpreted.
  const run = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  last = classify(run.stdout ?? '');

  if (last.kind === 'report') {
    const n = countAtOrAbove(last.report, LEVEL);
    if (n === 0) {
      console.log(`✅ npm audit: 0 advisories at "${LEVEL}" or above in production dependencies.`);
      process.exit(0);
    }
    // A real finding. Print the human-readable report so the log is actionable,
    // then fail — this is the gate doing its job.
    console.error(`❌ npm audit: ${n} advisory/advisories at "${LEVEL}" or above in production dependencies.\n`);
    const human = spawnSync('npm', ['audit', '--omit=dev', `--audit-level=${LEVEL}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    console.error(human.stdout ?? '');
    console.error(
      'This is a REAL finding, not an outage. Fix it (`npm audit fix --package-lock-only --omit=dev`)\n' +
        'or accept it explicitly. Do not make this job incapable of failing — see the header of\n' +
        '.github/workflows/security-audit.yml for what happened last time someone did.',
    );
    process.exit(1);
  }

  const why = last.kind === 'registry_error'
    ? JSON.stringify(last.detail)
    : `unparseable output (${(run.stdout ?? '').slice(0, 200) || 'empty'})`;
  console.error(`attempt ${attempt + 1}/${ATTEMPTS}: npm audit did not return a report — ${why}`);
}

// Retries exhausted without a usable report. FAIL — the security state is
// unknown, and unknown is not clean. But say plainly that this is npm's
// availability, not a vulnerability, so nobody spends an hour bisecting.
console.error(
  `\n❌ npm audit could not be completed after ${ATTEMPTS} attempts.\n\n` +
    'This is an npm REGISTRY/AVAILABILITY failure, NOT a vulnerability finding.\n' +
    'The advisory endpoint (registry.npmjs.org/-/npm/v1/security/audits/quick) did not\n' +
    'return a report, so the security state of production dependencies is UNKNOWN.\n\n' +
    'Unknown is not clean, so this job fails rather than passing on a check it could not\n' +
    'perform. Re-run the job once https://status.npmjs.org reports the registry healthy.\n' +
    'Nothing in the pull request needs changing.',
);
process.exit(1);
