-- 024_better_auth_core.sql
-- Better Auth core schema (Supabase Auth → Better Auth migration, gated).
--
-- ADDITIVE + NON-DESTRUCTIVE: creates the four Better Auth tables and touches
-- nothing existing, so it is safe to apply at any time. Better Auth lives in
-- OUR Postgres (reuse the Supabase database via DATABASE_URL). Column names are
-- Better Auth's canonical camelCase (quoted) — do NOT snake_case them, the
-- adapter binds to these exact identifiers.
--
-- The destructive step — re-keying `profiles`/`orders`/assessment rows off
-- auth.users(id) onto "user"(id) and moving the handle_new_user trigger — is a
-- SEPARATE, data-dependent migration (025) written once the founder confirms
-- fresh-start vs. migrate-existing. See docs/BETTER-AUTH-MIGRATION.md.
--
-- SECURITY — RLS is ENABLED with NO policies on all four tables. This is
-- deliberate and load-bearing: these tables live in the `public` schema of a
-- Supabase project whose anon/authenticated PostgREST API is internet-exposed.
-- They hold session tokens, password hashes, and OAuth access/refresh tokens —
-- if RLS were disabled, anyone holding the public anon key could read every
-- session token via `GET /rest/v1/session` and take over any account.
--
-- Enabling RLS with zero policies denies ALL PostgREST (anon/authenticated)
-- access, closing that hole. Better Auth is unaffected: it connects over a
-- direct Postgres pool (DATABASE_URL) as the table OWNER, which bypasses RLS by
-- default. We do NOT `force row level security` (that would apply RLS to the
-- owner too and lock Better Auth out). Authorization for app reads still lives
-- in route/app code through lib/auth/session.ts — not via auth.uid() RLS.

create table if not exists "user" (
  "id"            text primary key,
  "name"          text not null default '',
  "email"         text not null unique,
  "emailVerified" boolean not null default false,
  "image"         text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create table if not exists "session" (
  "id"        text primary key,
  "expiresAt" timestamptz not null,
  "token"     text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    text not null references "user" ("id") on delete cascade
);
create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "session_token_idx" on "session" ("token");

create table if not exists "account" (
  "id"                    text primary key,
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                text not null references "user" ("id") on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);
create index if not exists "account_userId_idx" on "account" ("userId");

create table if not exists "verification" (
  "id"         text primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamptz not null,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- Additive link column so existing profiles can be associated with a Better
-- Auth user id during migration without dropping any constraint yet (nullable,
-- unique-when-present). The full re-key is migration 025.
alter table if exists "profiles"
  add column if not exists "better_auth_user_id" text;
create unique index if not exists "profiles_better_auth_user_id_key"
  on "profiles" ("better_auth_user_id")
  where "better_auth_user_id" is not null;

-- ── RLS: lock these tables away from the exposed PostgREST/anon API ──────────
-- Enable RLS with NO policies → PostgREST (anon + authenticated) is denied on
-- every row, so session tokens / password hashes / OAuth tokens can never be
-- read with the public anon key. Better Auth's direct owner-role Pool bypasses
-- RLS, so its reads/writes are untouched. (No FORCE — the owner must stay
-- exempt or Better Auth locks itself out.)
alter table "user"         enable row level security;
alter table "session"      enable row level security;
alter table "account"      enable row level security;
alter table "verification" enable row level security;

-- Defense in depth: revoke the implicit grants Supabase hands the API roles so
-- the tables are not even reachable before the RLS check. Better Auth (owner)
-- and service_role are unaffected.
revoke all on "user", "session", "account", "verification" from anon, authenticated;
