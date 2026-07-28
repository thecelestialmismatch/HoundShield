# Leaked Credentials — What to Rotate, and Why It Is Urgent

**Status: credentials from an older project are readable, right now, by anyone on the
internet, in this repository's git history.**

The repo is **public** (`github.com/thecelestialmismatch/HoundShield` returns 200 to an
anonymous request). Deleting a file in a later commit does **not** remove it from
history — `git show <old-sha>:<path>` still prints the contents. Anyone who has ever
cloned or forked the repo already has them.

---

## What leaked

Two files were committed on **2026-02-25** and deleted on **2026-03-01** (commit
`3ca8296`). They belong to an **earlier, unrelated project** — a MongoDB/React app, not
HoundShield — but the secrets in them are real.

| File | Variable | Severity | Why |
|---|---|---|---|
| `backend/.env` | `MONGO_URL` | **High** | DB connection string, usually embeds user:password. Anyone can try to connect. |
| `backend/.env` | `JWT_SECRET` | **High** | Signs auth tokens. Whoever holds it can mint a valid session for any user of that app. |
| `backend/.env` | `EMERGENT_LLM_KEY` | **High** | LLM API key. Billable — this is the one that quietly costs money. |
| `backend/.env` | `STRIPE_API_KEY` | Low | `sk_test_…` — a **test** key. Cannot move real money. Rotate anyway. |
| `frontend/.env` | `REACT_APP_BACKEND_URL` | None | A URL, not a secret. No action. |

To see them yourself:

```bash
git show a0f0bdc:backend/.env
```

---

## Step 1 — Rotate. Do this FIRST, before any history rewrite.

**Order matters.** Rewriting history first is a loud, public signal that something
sensitive was in there — it invites people to check their existing clones. Kill the
value of the secrets first, then clean up.

Only you can do this; these are other providers' consoles.

1. **`EMERGENT_LLM_KEY`** — revoke in that provider's dashboard. Check billing for usage
   you don't recognise. *Do this one first: it is the only one that can be silently
   costing you money right now.*
2. **`MONGO_URL`** — rotate the database user's password (Atlas: Database Access → Edit →
   Edit Password). If the cluster is retired, confirm it is actually deleted, not paused.
3. **`JWT_SECRET`** — generate a new one (`openssl rand -hex 32`). Note this invalidates
   every existing session for that app, which is the point.
4. **`STRIPE_API_KEY`** — Stripe → Developers → API keys → roll the **test** key.

**If that project is dead and all four services are deleted**, say so and no rotation is
needed — a credential to nothing is not a credential. Confirm deletion rather than
assuming it.

---

## Step 2 — Purge from history (I do this, on your go-ahead)

Only after Step 1. This is **irreversible**:

- Every commit SHA changes.
- Existing clones and forks break and must be re-cloned.
- A full backup bundle already exists at
  `~/HoundShield-Local-Archive/houndshield-full-backup-20260728.bundle` — that is the undo.

```bash
# Restore point already taken:
#   git bundle create ~/HoundShield-Local-Archive/houndshield-full-backup-20260728.bundle --all

pipx install git-filter-repo        # or: brew install git-filter-repo
git filter-repo --path backend/.env --path frontend/.env --invert-paths --force
git push origin --force --all
git push origin --force --tags
```

Verify the purge:

```bash
git log --all --diff-filter=A --name-only --format="" -- '*.env' | sort -u
# expected: empty
```

---

## Step 3 — Make it impossible to recur

`.gitignore` already covers `.env`, `.env.local`, `.env.*.local` and `*.env`, and only
`.env.example` files are tracked today — so the current state is correct. The gap is that
nothing *enforces* it. Add a scanner to the pre-commit hook:

```bash
brew install gitleaks
gitleaks detect --no-git --redact   # run once now; expect 0 findings
```

Then add `gitleaks protect --staged --redact` to `.githooks/pre-commit`.

---

## What was checked and is clean

Verified during this audit, so you don't have to re-do it:

- **No live Stripe secret** anywhere in tracked files. The only `sk_live_` match is
  `sk_live_a1b2c3d4e5f6` — a fake fixture in `lib/stripe/__tests__/env.test.ts`.
- **No `.env` files tracked** on the current branch. Only `.env.example` templates.
- **No Supabase service-role key, JWT, or `sk-ant-` key** in tracked source.

The exposure is confined to those two historical files from the earlier project.

---

## Honest severity

This is **not** a five-alarm breach. The keys belong to a dead-or-dying side project, the
Stripe key is a test key, and there is no evidence of exploitation. But `EMERGENT_LLM_KEY`
is billable and `MONGO_URL` may still resolve, so "probably fine" is not good enough.

**Rotation takes about 15 minutes and ends the exposure permanently. Do it today.**
