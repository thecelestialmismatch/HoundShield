# Auth migration: Supabase Auth → Better Auth

Better Auth is **built and wired, but env-gated** — it is dormant until you flip
`AUTH_PROVIDER`. Until then the app runs on Supabase Auth exactly as before, so
merging this never breaks production. Data stays in **our** Postgres (reuse the
Supabase Postgres), which fits the local-only story and costs nothing.

## Architecture

| Piece | File |
|-------|------|
| Provider gate (pure, test/edge-safe) | `lib/auth/auth-config.ts` — `isBetterAuthEnabled()` |
| Server auth instance (lazy, `pg` Pool) | `lib/auth/better-auth.ts` — `getAuth()` |
| Browser client | `lib/auth/auth-client.ts` — `authClient`, `isBetterAuthClientEnabled()` |
| Unified session resolver (BA or Supabase) | `lib/auth/session.ts` — `getSessionUser()` |
| API catch-all (sign-in/up/social/session) | `app/api/auth/[...all]/route.ts` |
| Route protection | `middleware.ts` (cookie-based when BA active) |
| DB schema | `supabase/migrations/024_better_auth_core.sql` |
| Transactional email (reset / verify) | `lib/auth/auth-emails.ts` (Resend) |
| Password-reset UI | `app/forgot-password/page.tsx` → `app/reset-password/page.tsx` |

**Password reset & verification email** are wired through Resend (the app's
email provider): `sendResetPassword` / `sendVerificationEmail` in
`lib/auth/better-auth.ts` call the branded builders in `lib/auth/auth-emails.ts`.
A missing `RESEND_API_KEY` is a graceful no-op (logged), so flows never hard-fail
in dev. The reset link lands on `/reset-password?token=…`; `requestPasswordReset`
reports success even for unknown emails (no account enumeration). Email
verification is built but left optional (`requireEmailVerification: false`) — flip
it on in `better-auth.ts` when you want it enforced.

Everything routes through `getSessionUser()` and `isBetterAuthEnabled()`, so the
cutover is a single env flip — no code change.

## Security: RLS on the Better Auth tables (non-negotiable)

The four Better Auth tables (`user`, `session`, `account`, `verification`) live
in the **public** schema of a Supabase project whose anon/authenticated
PostgREST API is internet-exposed. They hold **session tokens, password hashes,
and OAuth access/refresh tokens**. If RLS were disabled, anyone holding the
public anon key could read every session token via `GET /rest/v1/session` and
take over any account.

Migration 024 therefore **enables RLS with zero policies** on all four tables
and **revokes** the implicit `anon`/`authenticated` grants:

- PostgREST (anon + authenticated) → denied on every row. Hole closed.
- Better Auth → **unaffected**: it connects over a direct Postgres pool
  (`DATABASE_URL`) as the table **owner**, which bypasses RLS by default.

Two rules keep this correct, pinned by
`lib/auth/__tests__/better-auth-migration-security.test.ts`:

1. **Never** `disable row level security` on these tables.
2. **Never** `force row level security` — FORCE applies RLS to the owner too and
   would lock Better Auth out. App-layer authorization (`getSessionUser()` +
   api-guard) is what gates reads, exactly as for the rest of the app.

## Environment variables

Set in `.env.local` (local) and Vercel (prod). Never commit secrets.

```
AUTH_PROVIDER=better-auth            # server flag (default: supabase)
NEXT_PUBLIC_AUTH_PROVIDER=better-auth # client flag — keep in lockstep
BETTER_AUTH_SECRET=<32+ random bytes> # openssl rand -base64 32
BETTER_AUTH_URL=https://www.houndshield.com   # localhost:3000 in dev
DATABASE_URL=postgres://...           # Supabase → Settings → Database → Connection string
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...              # ⚠ ROTATE — was pasted in chat
GOOGLE_CLIENT_ID=...                  # optional
GOOGLE_CLIENT_SECRET=...              # optional
```

### Getting `DATABASE_URL` from Supabase
Supabase Dashboard → **Project Settings → Database → Connection string → URI**.
Use the **Session pooler** URI (works from Vercel serverless). Append
`?sslmode=require`. It looks like:
`postgresql://postgres.<ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`

### GitHub OAuth App
`https://github.com/settings/developers` → OAuth Apps. Homepage
`https://www.houndshield.com`, **Authorization callback URL**
`https://www.houndshield.com/api/auth/callback/github`. (Second app with
`http://localhost:3000/api/auth/callback/github` for local dev — GitHub allows
one callback per app.) **Regenerate the client secret** that was shared in chat.

## Activation checklist

1. Put `DATABASE_URL` + `BETTER_AUTH_SECRET` in `.env.local`.
2. Apply the schema: `psql "$DATABASE_URL" -f supabase/migrations/024_better_auth_core.sql`
   (or `npx supabase db push`). Optionally regenerate the exact schema with
   `npx @better-auth/cli generate` and diff.
3. Set `AUTH_PROVIDER=better-auth` **and** `NEXT_PUBLIC_AUTH_PROVIDER=better-auth`.
4. `npm run dev` → sign up with email/password, then GitHub. Confirm `/console`
   loads and `/command-center` is protected (logged-out → `/login`).
5. Set the same env vars in **Vercel** (Production + Preview), redeploy.
6. Roll back instantly by setting `AUTH_PROVIDER=supabase` — no code change.

## The data re-key (migration 025 — deliberately separate)

`profiles`, `orders`, and assessment rows are keyed by `auth.users(id)` (uuid)
and protected by RLS on `auth.uid()`. Better Auth issues its own sessions and
its `user.id` is `text`, so:

- **Authorization** already moved into app/route code via `getSessionUser()` +
  the api-guard helpers — it no longer depends on `auth.uid()` RLS.
- **Re-keying** the existing tables (drop the `auth.users` FKs, point them at
  `"user"(id)`, move the `handle_new_user` trigger onto `"user"`) is migration
  **025**, written once you confirm **fresh-start** (pre-revenue → simplest;
  ~no live users to carry) vs **migrate-existing** (export `auth.users` →
  `"user"`, preserve ids). Migration 024 adds a nullable `profiles.better_auth_user_id`
  link column so either path is possible without data loss.

Recommendation given Stage 1 (pre-revenue): **fresh-start**. New Better Auth
signups create `profiles` rows keyed by the Better Auth user id via a trigger in
025; no legacy user data to migrate.

## Rollback
`AUTH_PROVIDER=supabase` (+ `NEXT_PUBLIC_AUTH_PROVIDER=supabase`) → the app is
back on Supabase Auth immediately. The Better Auth tables are harmless if left in
place.
