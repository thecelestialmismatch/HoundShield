# Leak guard — why CI blocks secrets and personal addresses

`scripts/verify-no-leaks.mjs` fails CI when a tracked file contains a credential
or a personal email address. This document explains what it catches, what it
deliberately does not, and how to respond when it fires.

Run it yourself before pushing:

```bash
node scripts/verify-no-leaks.mjs              # scan tracked files
node scripts/verify-no-leaks.mjs --self-test  # prove the rules still discriminate
```

CI runs both on every PR (`Secret & PII Guard` in `.github/workflows/ci.yml`).

---

## Why it exists

Two incidents, one class of failure.

1. **2026-07-29 — founder identity.** The founder's name and mailbox were
   committed to this repository, which is public. A human reading the diff
   caught it. Nothing in CI would have.
2. **Earlier, recorded in `docs/SECURITY-ROTATION.md`** — an older project's
   `backend/.env` was committed with a live Mongo URL, a JWT signing secret and
   an LLM API key. The file was deleted six days later. **The credentials are
   still readable in git history**, because deleting a file does not remove it
   from previous commits.

Incident 2 is the reason this is a hard gate rather than a warning. A leaked
credential is not undone by a follow-up commit; the only real remedy is
rotation. The cheap moment to stop it is before the push.

## What it catches

| Rule | Shape |
|------|-------|
| `stripe-secret` / `stripe-restricted` / `stripe-webhook` | `sk_live_`, `sk_test_`, `rk_*`, `whsec_` |
| `resend` | `re_…` |
| `openai` / `anthropic` / `openrouter` | `sk-proj-`, `sk-ant-`, `sk-or-v1-` |
| `aws-access-key` | `AKIA…` |
| `github-token` | `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_` |
| `supabase-cli` | `sbp_…` |
| `slack-token` / `sendgrid` | `xoxb-…`, `SG.…` |
| `jwt` | three base64url segments whose header carries `alg` — a Supabase service-role token is a full database bypass |
| `private-key` | a `-----BEGIN … PRIVATE KEY-----` header **followed by a base64 body** |
| `db-url-with-password` | `postgres://user:pass@remote.host` — the shape of the leak in incident 2 |
| `tracked-env-file` | any tracked `.env*` that is not `.example` / `.sample` / `.template` |
| `personal-email` | an address on a consumer domain (gmail, outlook, proton, …) |
| `personal-company-email` | a **named** mailbox on `houndshield.com` — anything outside the published role list below |

## Role addresses vs. personal ones on the company domain

The consumer-domain rule shipped first, and it left an obvious hole: the
founder's mailbox is on `houndshield.com`, not gmail.com, so nothing looked at
it. It survived the 2026-07-29 scrub and sat in `tasks/todo.md` for months.

`personal-company-email` closes that. It flags every `@houndshield.com` address
whose local part is not a **role**: a mailbox that names a *function* and is
meant to be read by strangers.

Published today, and asserted by the self-test so a rule change cannot silently
break `/contact`:

| Local part | Printed by |
|------------|-----------|
| `contact@` | `app/contact/page.tsx`, `app/partners/apply/PartnerApplyForm.tsx` |
| `info@` | `components/GlobalChat.tsx`, `lib/brain-ai/faq.ts`, `sdk/package.json` |
| `support@` | `app/contact`, `app/status`, `app/report/thank-you`, `ai-plugin.json` |
| `security@` | `app/security`, `app/trust`, `.well-known/security.txt`, `SECURITY.md` |
| `legal@` | `app/privacy`, `app/terms`, `app/dpa`, `app/trust` |
| `abuse@` | `app/acceptable-use/page.tsx` |
| `noreply@` / `no-reply@` | the transactional envelope sender (`lib/email/identity.ts`) |

`privacy@`, `dpa@`, `partners@`, `sales@` and `hello@` are allowed but not
printed anywhere today. They are carried over deliberately from the `GENERIC`
set in `lib/email/__tests__/email-identity-single-source.test.ts`, so the
repo-wide guard and the page-level guard agree on what a role address is instead
of disagreeing by one word. **The two lists are separate constants in two
languages — change one, change the other.**

The match is **case-insensitive**, because the address this rule was written for
was committed with a capital in both halves and a lowercase-only pattern would
have missed the exact string it exists to catch.

## Three design decisions worth knowing

**It scans only git-tracked files.** `git ls-files` is the threat model stated
exactly: what is tracked is what lands on GitHub. It also excludes
`node_modules`, `.next` and untracked scratch files for free, with no ignore
list to drift out of date.

**It allowlists values, never paths.** This repo legitimately contains around
thirty fake credentials in tests and demo copy — `sk_live_a1b2c3d4e5f6`,
`AKIAIOSFODNN7EXAMPLE`, and so on. The tempting shortcut is to skip
`__tests__/` and `app/demo/`. That is how secret scanners get quietly defanged:
the next *real* key pasted into a test file sails through. Every known fake is
therefore recognised by its own shape, so a new secret in an
already-forgiving file still fails.

**It discriminates on shape, not just prefix.** Prefix-only matching is why
teams delete their scanner. In this repo alone, `re_[a-z]+` matches the ordinary
identifiers `re_pageview`, `re_patterns`, `re_evidence` and `re_contexts`; a bare
`eyJ` matches every inline sourcemap in `public/_bootstrap.html` and integrity
hashes in `package-lock.json`. A candidate must therefore also clear:

- a **length floor** (20 chars) — kills `whsec_test123`, `re_pageview`
- a **repeated-run check** — kills `re_supersecret…YYYYYYYYYYYY`
- a **sequential-run check** — kills `AKIA1234567890ABCD12`, which has no
  repeat and no placeholder word, so only its `1234567890` gives it away
- a **character-mix** requirement — kills camelCase identifiers
- a **Shannon entropy floor** of 3.2 bits/char — kills English prose
- for JWTs, the header must actually **decode to JSON containing `alg`**
- for private keys, the header must be **followed by base64 body**, because
  detecting these shapes is literally this product's job and
  `proxy/PATTERNS.md` quotes them as examples

False positives are treated as bugs in the guard, not as reasons to add an
exclusion.

## Responding to a hit

**A real credential.** Rotate it first — assume it is already compromised —
then remove it. Follow `docs/SECURITY-ROTATION.md`. Do not reorder these
steps: a history rewrite that precedes rotation leaves a live secret in every
existing clone and fork.

**A personal address.** Move it to an environment variable. Founder identity
belongs in `FOUNDER_NAME` / `FOUNDER_EMAIL` and is resolved at runtime by
`compliance-firewall-agent/lib/email/identity.ts`. See
`docs/FOUNDER-EMAIL-IDENTITY.md`. In prose — a task log, a lesson, a runbook —
the fix is not deletion but **role-neutral wording**: "the founder's mailbox"
carries the same meaning and names nobody. Hand-edit each hit and re-read the
passage; `tasks/lessons.md` records what a blanket regex did to this exact
prose last time.

**A deliberate fake.** Make it look deliberate: shorten it below 20 characters,
add a placeholder marker (`xxxx`, `EXAMPLE`, `your-`), or give it a repeated or
sequential run. If it genuinely must stay long and random-looking, add the exact
value to the relevant rule's fixture list in `scripts/verify-no-leaks.mjs` —
**never a whole path.**

## The self-test

`--self-test` feeds 16 credential and identity shapes that must all be flagged
and 32 known-benign strings that must all pass, then fails if any is wrong. It
runs in CI ahead of the scan.

Every email fixture in it is **synthetic**. Using the real founder Gmail or the
real work mailbox as a must-flag fixture would re-commit the exact value the
rule exists to remove — the guard would then be leaking what it guards.

This matters because a guard nobody has watched fail is a guard nobody knows
works. Every MUST_PASS entry is a string that really appears in this repository,
and three of the rules above exist only because the self-test caught the guard
being wrong before it ever ran on a PR.

It also asserts that the self-referential exclusion list — this file and the
guard script, which necessarily contain the patterns they describe — stays at
exactly two entries. An exclusion list nobody can grow is a monitored hole. One
that grows a "just this once" at a time is how the control dies.

## Known limitations

Two, and neither is closed by this gate.

**History is not scanned.** The guard checks the working tree, not previous
commits. The credentials from incident 2 — and the founder's name and mailbox,
scrubbed from `tasks/` on 2026-08-04 — are still readable in this repository's
history. Removing them requires a history rewrite and a force-push, which needs
an explicit founder decision, and rotation must come first regardless.
`docs/SECURITY-ROTATION.md` tracks that work. `git log -S'<the string>'`
confirms the exposure without touching anything.

**A bare name with no address attached is not caught.** Both identity rules key
on an email address, so re-introducing the founder's name on its own — in a
commit message, a task log, a PR body — passes. Closing that would mean
committing the name to the guard as a pattern, which recreates the leak, and the
self-referential exclusion list is asserted at exactly two entries so no new file
can be sheltered to hold it. This is a real hole, stated plainly rather than
implied away: the control makes the *address* class un-repeatable, not the name.
