-- ============================================================
-- Migration 028: Shared-state rate limit buckets
-- Date: 2026-07-29
-- Gives the app a rate limiter that actually limits.
--
-- Why this exists:
--   Both existing limiters (middleware.ts `rateLimitMap`, lib/rate-limit.ts
--   `rateLimiters`) are in-memory Maps. On Vercel Fluid Compute each function
--   instance holds its OWN Map, so the effective limit is
--   (configured limit x number of live instances) — unbounded in practice, and
--   it resets on every cold start. That is not a limit; it is a speed bump.
--   The routes this protects spend real money per call (OpenRouter tokens via
--   Brain AI and the gateway), so "roughly limited" is a billing exposure.
--
-- Design:
--   • One row per bucket key. The key is caller-scoped (user id when known,
--     hashed IP otherwise) AND route-scoped, so a flood of one endpoint cannot
--     consume another endpoint's budget.
--   • Counting happens in ONE statement (insert .. on conflict do update).
--     Postgres takes a row lock for the duration, so concurrent requests from
--     different instances serialise correctly. Read-then-write would race.
--   • The window is fixed, not sliding: when `expires_at` has passed the same
--     statement resets the count to 1 and starts a fresh window. No separate
--     expiry job is required for correctness.
--
-- Privacy posture:
--   Bucket keys NEVER contain a raw IP, prompt text, or any CUI/PHI. The route
--   layer hashes the IP before it reaches this table (see lib/rate-limit-shared.ts).
--   Rows carry a count and two timestamps — nothing else.
--
-- Additive only. No existing table is altered.
-- ============================================================

create table if not exists rate_limit_buckets (
  bucket_key        text        primary key,   -- "<route>:<user id | ip hash>" — never a raw IP
  request_count     integer     not null default 0,
  window_started_at timestamptz not null default now(),
  expires_at        timestamptz not null
);

-- Supports the sweep below. The hot path is a primary-key hit and needs no index.
create index if not exists rate_limit_buckets_expires_at_idx
  on rate_limit_buckets (expires_at);

-- No user ever reads this table; only the service role touches it via the RPC.
alter table rate_limit_buckets enable row level security;

-- ------------------------------------------------------------
-- consume_rate_limit — atomically count one request against a bucket.
--
-- Returns the decision for THIS request:
--   allowed   — false once the count exceeds p_max within the window
--   remaining — requests left in this window (never negative)
--   reset_at  — when the current window ends
--
-- security definer so the RPC works with RLS enabled above.
-- ------------------------------------------------------------
create or replace function consume_rate_limit(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamptz := now();
  v_count integer;
  v_reset timestamptz;
begin
  if p_max < 1 or p_window_seconds < 1 then
    raise exception 'consume_rate_limit: p_max and p_window_seconds must be >= 1';
  end if;

  insert into rate_limit_buckets as b (bucket_key, request_count, window_started_at, expires_at)
  values (p_key, 1, v_now, v_now + make_interval(secs => p_window_seconds))
  on conflict (bucket_key) do update
    set
      -- Window already elapsed → this request starts a brand-new window.
      request_count     = case when b.expires_at <= v_now then 1 else b.request_count + 1 end,
      window_started_at = case when b.expires_at <= v_now then v_now else b.window_started_at end,
      expires_at        = case
                            when b.expires_at <= v_now
                              then v_now + make_interval(secs => p_window_seconds)
                            else b.expires_at
                          end
  returning b.request_count, b.expires_at
  into v_count, v_reset;

  return query
    select (v_count <= p_max), greatest(0, p_max - v_count), v_reset;
end;
$$;

-- ------------------------------------------------------------
-- sweep_rate_limit_buckets — drop rows whose window closed.
-- Purely housekeeping: correctness does not depend on it (the RPC resets an
-- elapsed window in place). Safe to call from a cron or by hand.
-- ------------------------------------------------------------
create or replace function sweep_rate_limit_buckets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from rate_limit_buckets where expires_at <= now() - interval '1 hour';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
