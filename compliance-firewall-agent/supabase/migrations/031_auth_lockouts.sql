-- ============================================================
-- Migration 031: Sign-in lockout (NIST 800-171 3.1.8 / CMMC AC.2.008)
-- Date: 2026-08-11
--
-- Why this exists:
--   HoundShield grades its own customers on AC.2.008, "Limit Unsuccessful
--   Logon Attempts" (lib/shieldready/controls/ac.ts:306, -3 SPRS), and asks
--   them whether accounts lock automatically after a defined number of
--   consecutive failures. HoundShield's own answer was no. This table is the
--   answer becoming yes.
--
--   Migration 028 (rate_limit_buckets) does NOT cover this. A rate limit caps
--   requests per window; a lockout is stateful across windows — it counts
--   CONSECUTIVE failures, clears on success, and must refuse even a CORRECT
--   password while the lock holds. That last property is exactly what the
--   control's evidence requirement tests ("deliberately enter the wrong
--   password N times and confirm the account locks"), and a fixed window
--   cannot express it.
--
-- Design:
--   • One row per email HASH. Counting and locking happen in ONE statement
--     (insert .. on conflict do update), so Postgres holds a row lock for the
--     duration and concurrent attempts from different Fluid Compute instances
--     serialise. Read-then-write would race, and a race here is a free extra
--     guess per instance.
--   • Reaching the threshold sets `locked_until` AND resets the counter, so a
--     caller gets a fresh allowance after the lock expires rather than being
--     re-locked by a single further mistake.
--   • Failures older than the lock window do not accumulate — "consecutive"
--     has to mean consecutive, or a careful user who mistypes once a month
--     eventually locks themselves out.
--   • Attempts made WHILE locked do not extend the lock. Otherwise an attacker
--     could hold a victim's account locked indefinitely — a denial-of-service
--     handed out for free.
--
-- ENUMERATION:
--   Rows are keyed on the hash of the SUBMITTED email whether or not it
--   resolves to an account. If only real accounts could lock, a "locked"
--   response would prove existence — the exact leak this work removes. Never
--   key this table on a user id.
--
-- Privacy posture:
--   Stores a SHA-256 prefix, two timestamps and a counter. Never an email
--   address, never an IP, never prompt content. Nothing here is CUI or PHI.
--
-- Additive only. No existing table is altered.
-- ============================================================

create table if not exists auth_lockouts (
  email_hash           text        primary key,   -- sha256(lower(trim(email)))[0:32] — never an address
  consecutive_failures integer     not null default 0,
  last_failure_at      timestamptz not null default now(),
  locked_until         timestamptz
);

-- Supports the sweep below. The hot path is a primary-key hit and needs no index.
create index if not exists auth_lockouts_last_failure_at_idx
  on auth_lockouts (last_failure_at);

-- No user ever reads this table; only the service role touches it.
alter table auth_lockouts enable row level security;

-- ------------------------------------------------------------
-- register_auth_failure — count one failed sign-in, lock at the threshold.
--
-- Returns the state AFTER this attempt:
--   consecutive_failures — 0 immediately after a lock trips (fresh allowance)
--   locked_until         — null when not locked
--
-- security definer so the RPC works with RLS enabled above.
-- ------------------------------------------------------------
create or replace function register_auth_failure(
  p_email_hash   text,
  p_threshold    integer,
  p_lock_minutes integer
)
returns table (consecutive_failures integer, locked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now    timestamptz := now();
  v_window interval;
  v_count  integer;
  v_locked timestamptz;
begin
  if p_threshold < 1 or p_lock_minutes < 1 then
    raise exception 'register_auth_failure: p_threshold and p_lock_minutes must be >= 1';
  end if;

  v_window := make_interval(mins => p_lock_minutes);

  insert into auth_lockouts as a (email_hash, consecutive_failures, last_failure_at, locked_until)
  values (p_email_hash, 1, v_now, null)
  on conflict (email_hash) do update
    set
      consecutive_failures = case
        -- Already locked: do not count, do not extend. Extending on every
        -- attempt would let an attacker pin a victim's account shut forever.
        when a.locked_until is not null and a.locked_until > v_now
          then a.consecutive_failures
        -- Last failure is older than the window → this one starts a new streak.
        when a.last_failure_at < v_now - v_window
          then 1
        -- Threshold reached → the lock is applied below and the count resets,
        -- so the caller gets a full allowance again once it expires.
        when a.consecutive_failures + 1 >= p_threshold
          then 0
        else a.consecutive_failures + 1
      end,
      locked_until = case
        when a.locked_until is not null and a.locked_until > v_now
          then a.locked_until
        when a.last_failure_at < v_now - v_window
          then null
        when a.consecutive_failures + 1 >= p_threshold
          then v_now + v_window
        else null
      end,
      last_failure_at = case
        -- Freeze the timestamp while locked so hammering cannot slide the window.
        when a.locked_until is not null and a.locked_until > v_now
          then a.last_failure_at
        else v_now
      end
  returning a.consecutive_failures, a.locked_until
  into v_count, v_locked;

  -- A threshold of 1 locks on the first failure; the insert path above cannot
  -- express that, so apply it here.
  if v_locked is null and p_threshold = 1 then
    update auth_lockouts
      set consecutive_failures = 0, locked_until = v_now + v_window
      where email_hash = p_email_hash
      returning auth_lockouts.consecutive_failures, auth_lockouts.locked_until
      into v_count, v_locked;
  end if;

  return query select v_count, v_locked;
end;
$$;

-- ------------------------------------------------------------
-- sweep_auth_lockouts — drop rows that are neither locked nor recently active.
-- Housekeeping only; correctness does not depend on it (a stale streak is
-- reset in place by the RPC above). Safe to call from a cron or by hand.
-- ------------------------------------------------------------
create or replace function sweep_auth_lockouts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from auth_lockouts
    where last_failure_at < now() - interval '24 hours'
      and (locked_until is null or locked_until <= now());
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Match migration 021: nothing public may execute these.
revoke execute on function register_auth_failure(text, integer, integer) from public, anon, authenticated;
revoke execute on function sweep_auth_lockouts() from public, anon, authenticated;
