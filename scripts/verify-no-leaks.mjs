#!/usr/bin/env node
/**
 * verify-no-leaks.mjs — refuse to let a real credential or a personal address
 * reach a PUBLIC GitHub repository.
 *
 * Zero dependencies (Node stdlib only). Run from anywhere in the repo:
 *
 *   node scripts/verify-no-leaks.mjs              # scan tracked files
 *   node scripts/verify-no-leaks.mjs --self-test  # prove the rules discriminate
 *
 * Exit 0 = clean. Exit 1 = something must not be pushed (CI-friendly).
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-07-29 the founder's name and mailbox were committed to this repo,
 * which is public. It was caught by a human reading the diff. Nothing in CI
 * would have stopped it, and nothing would have stopped it happening again.
 * `docs/SECURITY-ROTATION.md` records the same class of failure with real
 * consequences: an older project's `backend/.env` was committed with a live
 * Mongo URL, a JWT secret and an LLM key. Deleting the file did not remove it
 * from history. A review habit is not a control; this is the control.
 *
 * IT SCANS ONLY GIT-TRACKED FILES
 * -------------------------------
 * `git ls-files` is the threat model stated exactly: what is tracked is what
 * lands on GitHub. It also means node_modules, .next and untracked scratch
 * files are excluded for free, without a maintained ignore list that could
 * drift into hiding a real hit.
 *
 * IT ALLOWLISTS VALUES, NEVER PATHS
 * ---------------------------------
 * This repo legitimately contains ~30 fake credentials in tests and demo
 * copy (`sk_live_a1b2c3d4e5f6`, `AKIAIOSFODNN7EXAMPLE`, …). The tempting fix
 * is to skip `__tests__/` and `app/demo/`. That is how secret scanners get
 * quietly defanged: the next real key pasted into a test file sails through.
 * Instead every known-fake is allowlisted by its exact value, so a NEW secret
 * in an already-allowlisted file still fails.
 *
 * IT DISCRIMINATES ON SHAPE, NOT JUST PREFIX
 * ------------------------------------------
 * Prefix-only matching is why teams delete their scanner. In this repo alone,
 * `re_[a-z]+` matches the ordinary identifiers `re_pageview`, `re_patterns`,
 * `re_evidence` and `re_contexts`; bare `eyJ` matches every inline sourcemap
 * in `public/_bootstrap.html` and integrity hashes in package-lock.json. So a
 * candidate must also survive a length floor, a character-mix test, a Shannon
 * entropy floor, and a repeated-run check — and a JWT must actually decode to
 * a JOSE header. False positives are treated as bugs in this file.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The only two paths excluded from scanning, and why.
 *
 * This file necessarily contains every pattern and every allowlisted fake, and
 * the doc necessarily explains them. Both would match themselves.
 *
 * The list is exactly two entries and `--self-test` asserts that it stays
 * exactly two. An exclusion list nobody can grow is a monitored hole; an
 * exclusion list that grows one "just this once" at a time is how this control
 * dies.
 */
const SELF_REFERENTIAL = ['scripts/verify-no-leaks.mjs', 'docs/LEAK-GUARD.md']

/* ─────────────────────────── shape helpers ─────────────────────────── */

/** Shannon entropy in bits per character. Random keys sit above ~3.5; English prose and identifiers below ~3.2. */
function entropy(s) {
  const freq = new Map()
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  let h = 0
  for (const n of freq.values()) {
    const p = n / s.length
    h -= p * Math.log2(p)
  }
  return h
}

/** A run of 4+ identical characters — `YYYYYYYY`, `xxxxxxxx`, `000000`. Real keys effectively never do this; placeholders always do. */
function hasLongRun(s) {
  return /(.)\1{3,}/.test(s)
}

/**
 * A run of 5+ consecutive codepoints — `123456`, `abcdef`, `ABCDEFG`.
 *
 * The other half of the placeholder tell, and the one that caught
 * `AKIA1234567890ABCD12` (demo copy in InstantSnapshot.tsx): it has no repeated
 * character and no placeholder word, so only its sequence gives it away. In a
 * random base62 key the odds of five ascending codepoints in a row are about
 * 7e-6 across a 100-char key, so this cannot plausibly hide a live credential.
 */
function hasSequentialRun(s) {
  let run = 1
  for (let i = 1; i < s.length; i++) {
    const step = s.charCodeAt(i) - s.charCodeAt(i - 1)
    run = step === 1 || step === -1 ? run + 1 : 1
    if (run >= 5) return true
  }
  return false
}

/** Words that appear in placeholders and never in a live credential. */
const FAKE_MARKERS =
  /example|placeholder|redacted|your[-_]?|dummy|sample|fake|test|abc123|xxx|foo|bar|changeme|supersecret|s3cret|pasted|restricted123|<|>|\.\.\.|…|\$\{|\{\{/i

/**
 * Does the random tail of a key look actually random?
 *
 * Every clause here was forced by a real false positive in this repo — see the
 * header. Together they cost nothing on true positives (a live Stripe key is
 * 100+ high-entropy chars) and remove every known benign hit.
 */
function looksRandom(token) {
  if (token.length < 20) return false // `re_pageview`, `whsec_test123`, `sk_live_abc123`
  if (hasLongRun(token)) return false // `re_supersecret…YYYYYYYYYYYY`
  if (hasSequentialRun(token)) return false // `AKIA1234567890ABCD12`
  if (FAKE_MARKERS.test(token)) return false // documented fixtures
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/].filter((r) => r.test(token)).length
  if (classes < 2) return false // `re_whenCreateOrder` is camelCase with no digits
  return entropy(token) >= 3.2
}

/**
 * Is this a real JWT? Three base64url segments whose header decodes to JSON
 * carrying an `alg` claim.
 *
 * Bare `eyJ` is useless here: `public/_bootstrap.html` embeds inline sourcemaps
 * that base64-decode to perfectly valid JSON (`{"version":3,"names":[…]}`), so
 * "decodes to JSON" is not sufficient either. Requiring the JOSE `alg` claim
 * separates a Supabase service-role token from a sourcemap.
 */
function isRealJwt(candidate) {
  const parts = candidate.split('.')
  if (parts.length !== 3) return false
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    return typeof header === 'object' && header !== null && 'alg' in header
  } catch {
    return false
  }
}

/* ───────────────────────────── the rules ───────────────────────────── */

/** Passwords that only ever appear in local-dev and CI boilerplate. */
const DEV_PASSWORDS = new Set([
  'password', 'passwd', 'pass', 'postgres', 'mysql', 'root', 'admin', 'secret',
  'changeme', 'devpassword', 'dev', 'local', 'docker', 'example', 'test',
])

/**
 * Each rule: a regex whose capture group 1 is the part that must look random,
 * or a custom `verify`. `why` is printed on a hit so the fix is obvious.
 */
const SECRET_RULES = [
  { id: 'stripe-secret', re: /\bsk_(?:live|test)_([A-Za-z0-9]{16,})/g, why: 'Stripe secret key' },
  { id: 'stripe-restricted', re: /\brk_(?:live|test)_([A-Za-z0-9]{16,})/g, why: 'Stripe restricted key' },
  { id: 'stripe-webhook', re: /\bwhsec_([A-Za-z0-9]{16,})/g, why: 'Stripe webhook signing secret' },
  { id: 'resend', re: /\bre_([A-Za-z0-9]{20,})\b/g, why: 'Resend API key' },
  { id: 'openai', re: /\bsk-proj-([A-Za-z0-9_-]{20,})/g, why: 'OpenAI project key' },
  { id: 'anthropic', re: /\bsk-ant-(?:api\d\d-)?([A-Za-z0-9_-]{20,})/g, why: 'Anthropic API key' },
  { id: 'openrouter', re: /\bsk-or-v1-([a-f0-9]{32,})/g, why: 'OpenRouter API key' },
  { id: 'aws-access-key', re: /\b(AKIA[0-9A-Z]{16})\b/g, why: 'AWS access key ID' },
  { id: 'github-token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_([A-Za-z0-9]{20,})/g, why: 'GitHub token' },
  { id: 'supabase-cli', re: /\bsbp_([a-f0-9]{20,})/g, why: 'Supabase personal access token' },
  { id: 'slack-token', re: /\bxox[abprs]-([A-Za-z0-9-]{20,})/g, why: 'Slack token' },
  { id: 'sendgrid', re: /\bSG\.([A-Za-z0-9_-]{20,})/g, why: 'SendGrid API key' },
  {
    id: 'jwt',
    re: /\b(eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g,
    why: 'JWT (a Supabase service-role token is a full database bypass)',
    verify: (m) => isRealJwt(m) && !FAKE_MARKERS.test(m),
  },
  {
    id: 'private-key',
    // The header must be followed by actual base64 body. HoundShield's whole
    // product is detecting secret shapes, so its own docs quote these headers
    // (proxy/PATTERNS.md lists them as "examples detected"). A quoted header is
    // documentation; a header plus 60+ chars of base64 is a key.
    re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----([\s\S]{0,200})/g,
    why: 'private key block',
    verify: (body) => /[A-Za-z0-9+/=]{60,}/.test(body),
  },
  {
    id: 'db-url-with-password',
    // A connection string carrying inline credentials — the exact shape of the
    // leak recorded in docs/SECURITY-ROTATION.md.
    re: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^\s:/@"'`]+:([^\s:/@"'`]{4,})@([^\s:/?"'`]+)/g,
    why: 'database URL with an inline password',
    verify: (password, whole) => {
      if (FAKE_MARKERS.test(password) || hasLongRun(password)) return false
      // Dev boilerplate uses a word for the password, not a credential.
      if (DEV_PASSWORDS.has(password.toLowerCase())) return false
      // A leaked connection string points at a REAL remote host, which means a
      // dotted public domain. Local and container hostnames (`localhost`, `db`,
      // `postgres`, `127.0.0.1`) are docker-compose and CI fixtures — every one
      // of the seven hits in this repo when the guard was written.
      const host = whole.slice(whole.lastIndexOf('@') + 1)
      if (/^(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(host)) return false
      if (!host.includes('.')) return false // bare container/service name
      return true
    },
  },
]

/**
 * Consumer mail domains. A personal address on one of these is never load-bearing
 * in this codebase — the founder's identity comes from FOUNDER_EMAIL at runtime
 * precisely so it is not committed here.
 */
const CONSUMER_DOMAINS =
  /\b([A-Za-z0-9._%+-]+)@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|aol|icloud|me|mac|protonmail|proton|pm|gmx|zoho|yandex|mail|fastmail|hey)\.(?:com|me|co\.uk|de|ru)\b/g

/**
 * Local parts that are self-evidently fixtures. Compared by EQUALITY, not
 * substring.
 *
 * The distinction is the whole point: a real, reachable mailbox can CONTAIN a
 * fixture word — a project demo account whose local part ends in `.demo.account`
 * is a live inbox, not a placeholder — and a substring check on "demo" waves it
 * straight through. Equality catches it. Naming the offending address here to
 * illustrate the point would defeat the guard in the same breath as explaining
 * it, so the shape is described and the mailbox is not.
 */
const FIXTURE_LOCAL_PARTS = new Set([
  'someone', 'somebody', 'anyone', 'test', 'tester', 'user', 'you', 'me',
  'example', 'sample', 'demo', 'placeholder', 'nobody', 'foo', 'bar',
  'jane', 'jane.doe', 'janedoe', 'john', 'john.doe', 'johndoe',
  'alice', 'bob', 'carol', 'dave', 'eve',
])

/**
 * Fixtures that exist ONLY on the company domain — read by the company-mailbox
 * rule below and by nothing else.
 *
 * Deliberately a separate set rather than more entries in `FIXTURE_LOCAL_PARTS`:
 * that set is shared with the consumer-domain rule, so folding `dana` into it
 * would quietly let `dana@gmail.com` through as well. A fixture needed on one
 * domain must not widen the rule for the other.
 *
 * `somepersonsname@` is load-bearing: PR #252 proved the page-level mailbox
 * guard discriminates by injecting exactly that string, so renaming it would
 * destroy the evidence. `founder`/`notfounder`/`alerts` name a role, never a
 * human; `dana`/`d`/`second` are placeholder people in the spirit of
 * `alice`/`bob` above.
 */
const COMPANY_FIXTURE_LOCAL_PARTS = new Set([
  'founder', 'notfounder', 'alerts', 'dana', 'd', 'second', 'somepersonsname',
])

/**
 * Mailboxes on the COMPANY domain that the product genuinely publishes.
 *
 * `@houndshield.com` is not a consumer domain, so `CONSUMER_DOMAINS` never sees
 * it — which is exactly how the founder's own work mailbox survived the first
 * scrub and sat in `tasks/todo.md` on a public repo. A role address names a
 * function and is meant to be read by strangers; a personal one names a human
 * and belongs in `FOUNDER_EMAIL`, resolved at runtime.
 *
 * Every entry is auditable against a file that prints it:
 *   contact  — app/contact/page.tsx, app/partners/apply/PartnerApplyForm.tsx
 *   info     — components/GlobalChat.tsx, lib/brain-ai/faq.ts, sdk/package.json
 *   support  — app/contact, app/status, app/report/thank-you, ai-plugin.json
 *   security — app/security, app/trust, .well-known/security.txt, SECURITY.md
 *   legal    — app/privacy, app/terms, app/dpa, app/trust
 *   abuse    — app/acceptable-use/page.tsx
 *   noreply / no-reply — the transactional envelope sender (lib/email/identity.ts)
 *
 * The remainder (privacy, dpa, partners, sales, hello) are not printed today.
 * They are carried over deliberately from the page-level guard's GENERIC set in
 * `lib/email/__tests__/email-identity-single-source.test.ts`, so the two guards
 * agree on what counts as a role address rather than disagreeing by one word.
 */
const ROLE_LOCAL_PARTS = new Set([
  'contact', 'info', 'support', 'security', 'legal', 'abuse', 'noreply', 'no-reply',
  'privacy', 'dpa', 'partners', 'sales', 'hello',
])

/**
 * Case-insensitive on purpose. The address this rule was written for was
 * committed with a capital in BOTH halves — capitalised first name, capitalised
 * domain — so a lowercase-only pattern would have run green against the very
 * string it exists to catch. `Second@HoundShield.com` in the test suite is
 * independent proof that mixed case really occurs here.
 *
 * The leaked value itself is deliberately not quoted anywhere in this file: the
 * guard skips its own source (SELF_REFERENTIAL), so a "documentation" copy of it
 * here would be a leak no rule can see.
 */
const COMPANY_MAILBOX = /\b([A-Za-z0-9._%+-]+)@houndshield\.com\b/gi

/** Tracked env files. `.env.example` is the documented, deliberately value-free template. */
function isForbiddenEnvFile(rel) {
  const name = basename(rel)
  if (!/^\.env(\.|$)/.test(name)) return false
  return !/\.(example|sample|template)$/.test(name) && name !== '.env.d.ts'
}

/* ────────────────────────────── scanner ────────────────────────────── */

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  return out.toString('utf8').split('\0').filter(Boolean)
}

function isProbablyBinary(buf) {
  return buf.subarray(0, 8000).includes(0)
}

/** Report a hit with enough context to fix it, and never print the secret itself. */
function fingerprint(value) {
  if (value.length <= 8) return `${value.slice(0, 2)}…(${value.length} chars)`
  return `${value.slice(0, 4)}…${value.slice(-2)} (${value.length} chars)`
}

function lineOf(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (text[i] === '\n') line++
  return line
}

export function scanText(text) {
  /** @type {{rule: string, why: string, line: number, shown: string}[]} */
  const findings = []

  for (const rule of SECRET_RULES) {
    rule.re.lastIndex = 0
    for (const m of text.matchAll(rule.re)) {
      const whole = m[0]
      const token = m[1] ?? whole
      const ok = rule.verify ? rule.verify(token, whole) : looksRandom(token)
      if (!ok) continue
      findings.push({
        rule: rule.id,
        why: rule.why,
        line: lineOf(text, m.index ?? 0),
        shown: fingerprint(whole),
      })
    }
  }

  CONSUMER_DOMAINS.lastIndex = 0
  for (const m of text.matchAll(CONSUMER_DOMAINS)) {
    const local = m[1].toLowerCase()
    if (FIXTURE_LOCAL_PARTS.has(local)) continue
    findings.push({
      rule: 'personal-email',
      why: 'personal email address on a consumer domain',
      line: lineOf(text, m.index ?? 0),
      shown: `${local.slice(0, 3)}…@${m[2]}`,
    })
  }

  COMPANY_MAILBOX.lastIndex = 0
  for (const m of text.matchAll(COMPANY_MAILBOX)) {
    const local = m[1].toLowerCase()
    if (
      ROLE_LOCAL_PARTS.has(local) ||
      FIXTURE_LOCAL_PARTS.has(local) ||
      COMPANY_FIXTURE_LOCAL_PARTS.has(local)
    ) {
      continue
    }
    findings.push({
      rule: 'personal-company-email',
      why: 'a named mailbox on houndshield.com — role addresses are published, personal ones are not',
      line: lineOf(text, m.index ?? 0),
      shown: `${local.slice(0, 3)}…@houndshield.com`,
    })
  }

  return findings
}

function scanRepo() {
  const problems = []

  for (const rel of trackedFiles()) {
    if (SELF_REFERENTIAL.includes(rel)) continue

    if (isForbiddenEnvFile(rel)) {
      problems.push({
        rel,
        line: 0,
        rule: 'tracked-env-file',
        why: 'an env file is tracked — it will be published, and deleting it later does not remove it from history',
        shown: rel,
      })
      continue
    }

    let buf
    try {
      buf = readFileSync(resolve(ROOT, rel))
    } catch {
      continue // submodule pointer, broken symlink, or a path removed mid-run
    }
    if (isProbablyBinary(buf)) continue

    for (const f of scanText(buf.toString('utf8'))) problems.push({ rel, ...f })
  }

  return problems
}

/* ───────────────────────────── self-test ───────────────────────────── */

/**
 * Proves the rules discriminate. A guard nobody has seen fail is a guard nobody
 * knows works — every MUST_FLAG string is a credential shape, and every
 * MUST_PASS string is something that really appears in this repo and really
 * must not be reported.
 */
/**
 * Assemble a fixture from a split prefix so no complete credential-shaped
 * literal ever exists in this file.
 *
 * This is not paranoia, it is a bug report from production: the first push of
 * this guard was rejected by GitHub Push Protection, which read two of these
 * fixtures as a live Stripe key and a live Supabase token. That is a useful
 * independent verdict — the fixtures are realistic enough to be worth
 * flagging — but a test fixture must not be able to block a push, and the
 * alternative (clicking "allow this secret" on a GitHub unblock URL) trains
 * exactly the reflex this guard exists to prevent.
 *
 * Splitting the prefix defeats any provider-format scanner reading the file,
 * including future detectors GitHub has not shipped yet, while the assembled
 * value at runtime is still a full credential shape that our rules must catch.
 */
const synth = (...parts) => parts.join('')

const MUST_FLAG = [
  ['live Stripe key', `STRIPE_SECRET_KEY=${synth('sk_l', 'ive', '_51QwErTyUiOpAsDfGhJkLzXcVbNmQ2wS3eD4rF5tG6y')}`],
  ['Resend key', `RESEND_API_KEY=${synth('r', 'e_', '8kQ2mVnP4xR7wZ3bT6yH9jL5cD1sF0gA')}`],
  ['OpenAI key', synth('sk-', 'proj-', '9mK2vX7pQ4wR8tY3nB6hL1jD5sF0gZaCeIoU2rT4yW')],
  ['Anthropic key', synth('sk-', 'ant-', 'api03-', 'Kq7mV2pX9wR4tY3nB6hL1jD5sF0gZaCeIoU2rT4yWzQ')],
  ['AWS access key', `aws_access_key_id = ${synth('AK', 'IA', '3QW7ZX9MPLK2VNRT')}`],
  ['GitHub token', synth('gh', 'p_', '9kX2mQ7vP4wR8tY3nB6hL1jD5sF0gZaC')],
  ['Supabase PAT', synth('sb', 'p_', 'a3f9c2e7b104d85f6a2b9c8e7d4f1a0b3c6e9d2f')],
  ['Slack token', synth('xo', 'xb-', '2947158204-9fK3mQ7vP4wR8tY3nB6hL1jD')],
  [
    'service-role JWT',
    synth(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.',
      'eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.',
      '9mK2vX7pQ4wR8tY3nB6hL1jD5sF0gZaCeIoU',
    ),
  ],
  [
    'Mongo URL with password',
    `MONGO_URL=${synth('mongo', 'db+srv://', 'appuser:Xk7Qm2Vp9RtY3nB6@cluster0.abcd.mongodb.net/db')}`,
  ],
  [
    // A header with a base64 body. The bare header on its own is deliberately
    // NOT a finding — see the private-key rule and its MUST_PASS counterpart.
    'private key block with a body',
    synth(
      '-----BEGIN RSA PRI', 'VATE KEY-----\n',
      'MIIEowIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hyvGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA\n',
      '-----END RSA PRI', 'VATE KEY-----',
    ),
  ],
  // Synthetic addresses on purpose. The real founder Gmail and the real internal
  // demo account are what this guard was built to remove from the repo; putting
  // either one here as a fixture would reintroduce the leak it prevents. Any
  // non-fixture local part on a consumer domain exercises the same rule.
  ['a personal Gmail', `git config user.email "${synth('m.okonkwo', '.personal', '@gmail.com')}"`],
  ['a named account on a consumer domain', synth('acme.demo.', 'account', '@gmail.com')],
  ['a personal Outlook address', `contact ${synth('r.harper', '1987', '@outlook.com')} to confirm`],
  // A personal mailbox on the COMPANY domain. This is the gap that let the
  // founder's own work address survive the 2026-07-29 scrub: it is not a
  // consumer domain, so nothing looked at it. Synthetic names again — putting
  // the real one here would re-commit exactly what the rule removes.
  ['a personal mailbox on the company domain', `set ${synth('n.varga', '@houndshield.com')} as the sender`],
  // Mixed case in BOTH halves, which is how the real one was written.
  ['a mixed-case personal company mailbox', synth('N.Varga', '@Houndshield.com')],
  // Pins the two fixture sets apart: `dana` is allowed on the company domain
  // and must STILL be a personal address on a consumer one.
  ['a company-domain fixture name on a consumer domain', synth('dana', '@gmail.com')],
]

const MUST_PASS = [
  // Real fixtures and identifiers that exist in this repo today.
  ['short Stripe test fixture', "expect(key).toBe('sk_live_a1b2c3d4e5f6')"],
  ['documented Stripe fake', "const key = 'sk_test_a1b2c3d4e5f6'"],
  ['webhook test fixture', "process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123'"],
  ['restricted-key fixture', "'rk_live_restricted123'"],
  ['AWS docs example key', 'AKIAIOSFODNN7EXAMPLE'],
  ['demo-copy AWS key', 'AKIA1234567890ABCD12'],
  ['placeholder Resend key', "'re_supersecretresendkeyYYYYYYYYYYYY'"],
  ['placeholder service-role', "'eyJsupersecretserviceRoleXXXXXXXXXXXXXXXXXXXXXX'"],
  ['demo OpenAI key', 'sk-proj-abc123def456ghi789jkl012mno345pqr'],
  ['docs placeholder', 'OPENAI_API_KEY=sk-proj-xxxxx'],
  ['shell placeholder', 'GITHUB_TOKEN=ghp_xxxx'],
  // PostHog event names and ordinary identifiers that begin re_
  ['PostHog event', "posthog.capture('re_pageview')"],
  ['identifier', 'const re_patterns = compile(rules)'],
  ['identifier', 'const re_whenCreateOrder = /order/'],
  ['identifier', 're_supersecretserviceRole // not a key, a variable name'],
  // An inline sourcemap: valid base64 JSON, but no JOSE header.
  ['inline sourcemap', 'sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUmVhY3QiXX0='],
  ['lockfile integrity hash', '"integrity": "sha512-eyJIkqGIDMZPwPx24pUMfwSxxI8phr"'],
  // Neutral email fixtures the test suite relies on.
  ['neutral fixture', "const email = 'someone@gmail.com'"],
  ['docs fixture', 'jane.doe@gmail.com'],
  // Role mailboxes the site really prints. If the company-domain rule ever
  // starts flagging these, /contact and /security stop being reachable.
  ['product mailbox', 'contact@houndshield.com'],
  ['published support mailbox', 'mailto:support@houndshield.com'],
  ['published security mailbox', 'Contact: mailto:security@houndshield.com'],
  ['published legal mailbox', 'legal@houndshield.com'],
  ['transactional sender', "TRANSACTIONAL_FROM = 'HoundShield <noreply@houndshield.com>'"],
  ['env-var fixture on the company domain', "process.env.FOUNDER_EMAIL = 'founder@houndshield.com'"],
  ['placeholder-person fixture on the company domain', "expect(founderAddress()).toBe('dana@houndshield.com')"],
  ['env-var reference, not a value', 'process.env.RESEND_API_KEY'],
  // Local-dev and CI connection strings (7 such lines exist across docs/ and skills/).
  ['dev postgres URL', 'DATABASE_URL=postgresql://user:password@localhost:5432/mydb'],
  ['CI postgres URL', 'DATABASE_URL: postgres://postgres:postgres@localhost:5432/test'],
  ['compose postgres URL', '- DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev'],
  ['named dev URL', 'postgresql://houndshield:password@localhost:5432/houndshield'],
  // proxy/PATTERNS.md documents the shapes the scanner detects — detecting
  // these IS the product, so its own docs must not trip its own guard.
  ['documented key header', '- `-----BEGIN RSA PRIVATE KEY-----`, `-----BEGIN EC PRIVATE KEY-----`'],
  ['documented secret shapes', '`password=supersecret`, `secret_key = "abc123"`, `bearer_token: xyz`'],
]

function selfTest() {
  const failures = []

  if (SELF_REFERENTIAL.length !== 2) {
    failures.push(
      `the self-referential exclusion list has ${SELF_REFERENTIAL.length} entries, expected exactly 2 — ` +
        'growing it is how this guard stops guarding',
    )
  }

  for (const [label, sample] of MUST_FLAG) {
    if (scanText(sample).length === 0) failures.push(`MISSED: ${label} — the guard did not flag it`)
  }
  for (const [label, sample] of MUST_PASS) {
    const hits = scanText(sample)
    if (hits.length > 0) {
      failures.push(`FALSE POSITIVE: ${label} — flagged as ${hits.map((h) => h.rule).join(', ')}`)
    }
  }

  if (failures.length) {
    console.error('\nverify-no-leaks self-test FAILED:\n')
    for (const f of failures) console.error(`  ${f}`)
    console.error('')
    process.exit(1)
  }

  console.log(
    `verify-no-leaks self-test PASS — ${MUST_FLAG.length} credential shapes flagged, ` +
      `${MUST_PASS.length} known-benign strings ignored.`,
  )
}

/* ─────────────────────────────── main ─────────────────────────────── */

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const problems = scanRepo()

  if (problems.length === 0) {
    console.log('verify-no-leaks PASS — no credentials or personal addresses in tracked files.')
    return
  }

  console.error(`\nBLOCKED: ${problems.length} thing(s) must not be pushed to a public repository.\n`)
  for (const p of problems) {
    const where = p.line ? `${p.rel}:${p.line}` : p.rel
    console.error(`  ${where}`)
    console.error(`    ${p.rule} — ${p.why}`)
    console.error(`    found: ${p.shown}`)
  }
  console.error(`
HOW TO FIX
  A real credential   → rotate it FIRST (assume it is already compromised),
                        then remove it. See docs/SECURITY-ROTATION.md.
  A personal address  → move it to an env var. Founder identity belongs in
                        FOUNDER_NAME / FOUNDER_EMAIL, never in this repo.
  A deliberate fake   → shorten it, add a placeholder marker (xxxx / EXAMPLE),
                        or add the exact value to a rule's fixture list in
                        scripts/verify-no-leaks.mjs. Never add a whole PATH.
`)
  process.exit(1)
}

// Only run when executed directly, so --self-test can import the internals.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
