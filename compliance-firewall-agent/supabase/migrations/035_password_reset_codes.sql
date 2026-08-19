-- Migration 035: Application-owned password-reset codes
--
-- Reset links put a bearer artifact in request URLs, browser history, edge logs,
-- and mail-security scanners. This flow sends the raw code only in the email
-- body. The database stores only an HMAC/SHA-256 digest and atomically consumes
-- it before the application changes a password.
--
-- Security properties:
--   * raw codes are never stored
--   * a code expires within 60 minutes
--   * one successful consumer wins; races fail closed
--   * issuing a new code invalidates the prior unused code for that user
--   * no anonymous/authenticated role can read or execute these operations

create table if not exists public.password_reset_codes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  email_hash text        not null,
  code_hash  text        not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now(),
  constraint password_reset_codes_expiry_bounds
    check (expires_at <= created_at + interval '60 minutes')
);

create index if not exists password_reset_codes_user_active_idx
  on public.password_reset_codes (user_id, expires_at)
  where used_at is null;

create index if not exists password_reset_codes_expiry_idx
  on public.password_reset_codes (expires_at);

alter table public.password_reset_codes enable row level security;

-- Issue one code. Service role first resolves profiles.email to auth user id,
-- then this function invalidates any previous unused code for that user before
-- inserting the replacement. The input hashes are already opaque identifiers.
create or replace function public.issue_password_reset_code(
  p_email text,
  p_email_hash text,
  p_code_hash text,
  p_ttl_minutes integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_ttl_minutes < 1 or p_ttl_minutes > 60 then
    raise exception 'issue_password_reset_code: p_ttl_minutes must be between 1 and 60';
  end if;

  if length(p_email_hash) < 32 or length(p_code_hash) < 32 then
    raise exception 'issue_password_reset_code: invalid hash input';
  end if;

  -- `profiles_email_unique` makes the normalised lookup unambiguous. The raw
  -- address is only a function parameter and is never written to this table.
  select id into v_user_id
    from public.profiles
   where lower(email) = lower(p_email)
   limit 1;

  if v_user_id is null then
    return false;
  end if;

  update public.password_reset_codes
    set used_at = now()
    where user_id = v_user_id
      and used_at is null;

  insert into public.password_reset_codes (user_id, email_hash, code_hash, expires_at)
    values (v_user_id, p_email_hash, p_code_hash, now() + make_interval(mins => p_ttl_minutes));

  return true;
end;
$$;

-- Atomically consume one valid code. An UPDATE predicate—not read then write—
-- means concurrent requests cannot redeem the same code twice.
create or replace function public.consume_password_reset_code(
  p_email_hash text,
  p_code_hash text
)
returns table (user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.password_reset_codes
     set used_at = now()
   where email_hash = p_email_hash
     and code_hash = p_code_hash
     and used_at is null
     and expires_at > now()
  returning password_reset_codes.user_id;
end;
$$;

-- Housekeeping only; no correctness property relies on the sweep.
create or replace function public.sweep_password_reset_codes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.password_reset_codes
   where expires_at < now() - interval '24 hours';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on table public.password_reset_codes from public, anon, authenticated;
revoke execute on function public.issue_password_reset_code(text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.consume_password_reset_code(text, text) from public, anon, authenticated;
revoke execute on function public.sweep_password_reset_codes() from public, anon, authenticated;
grant execute on function public.issue_password_reset_code(text, text, text, integer) to service_role;
grant execute on function public.consume_password_reset_code(text, text) to service_role;
grant execute on function public.sweep_password_reset_codes() to service_role;
