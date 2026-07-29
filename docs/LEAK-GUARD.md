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
`docs/FOUNDER-EMAIL-IDENTITY.md`.

**A deliberate fake.** Make it look deliberate: shorten it below 20 characters,
add a placeholder marker (`xxxx`, `EXAMPLE`, `your-`), or give it a repeated or
sequential run. If it genuinely must stay long and random-looking, add the exact
value to the relevant rule's fixture list in `scripts/verify-no-leaks.mjs` —
**never a whole path.**

## The self-test

`--self-test` feeds 13 credential shapes that must all be flagged and 27
known-benign strings that must all pass, then fails if any is wrong. It runs in
CI ahead of the scan.

This matters because a guard nobody has watched fail is a guard nobody knows
works. Every MUST_PASS entry is a string that really appears in this repository,
and three of the rules above exist only because the self-test caught the guard
being wrong before it ever ran on a PR.

It also asserts that the self-referential exclusion list — this file and the
guard script, which necessarily contain the patterns they describe — stays at
exactly two entries. An exclusion list nobody can grow is a monitored hole. One
that grows a "just this once" at a time is how the control dies.

## Known limitation: history is not scanned

The guard checks the working tree, not previous commits. The credentials from
incident 2 are still present in this repository's history and are **not** caught
by this gate. Removing them requires a history rewrite and a force-push, which
needs an explicit founder decision, and rotation must come first regardless.
`docs/SECURITY-ROTATION.md` tracks that work.
