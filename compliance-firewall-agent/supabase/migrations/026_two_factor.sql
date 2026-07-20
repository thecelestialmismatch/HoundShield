-- 026_two_factor.sql
-- Email 2FA (second auth factor) for Better Auth — schema for the official
-- `twoFactor` plugin (better-auth v1.6). Column/table names follow Better
-- Auth's canonical camelCase (quoted), matching migration 024 — do NOT
-- snake_case them.
--
-- Additive and dormant until AUTH_PROVIDER=better-auth is set AND a user
-- enables 2FA from /console/security: the plugin only reads these tables for
-- users with "twoFactorEnabled" = true (default false for everyone).
--
-- Control mapping: NIST 800-171 3.5.3 (IA.3.083 — multifactor authentication
-- for network access) · HIPAA 164.312(d) (person or entity authentication).

-- Plugin flag on the Better Auth user row. Flipped true only after the user
-- proves the email-code loop works (enable → send code → verify code).
alter table "user"
  add column if not exists "twoFactorEnabled" boolean default false;

-- Per-user second-factor state: TOTP secret (unused by the email-OTP UI but
-- required by the plugin), hashed backup codes, and the plugin's account
-- lockout counters.
create table if not exists "twoFactor" (
  "id"                      text primary key,
  "secret"                  text not null,
  "backupCodes"             text not null,
  "userId"                  text not null references "user" ("id") on delete cascade,
  "verified"                boolean default true,
  "failedVerificationCount" integer default 0,
  "lockedUntil"             timestamptz
);

create index if not exists "twoFactor_userId_idx" on "twoFactor" ("userId");
create index if not exists "twoFactor_secret_idx" on "twoFactor" ("secret");

-- Same lockdown as migration 024: RLS with no policies denies the exposed
-- PostgREST roles (anon + authenticated) on every row, so factor secrets and
-- backup codes are never readable with the public anon key. Better Auth's
-- direct owner-role Pool bypasses RLS, so its reads/writes are untouched.
alter table "twoFactor" enable row level security;
revoke all on "twoFactor" from anon, authenticated;
