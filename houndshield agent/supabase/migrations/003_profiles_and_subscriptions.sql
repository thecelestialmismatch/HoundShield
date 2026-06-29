-- ============================================================
-- Profiles & Subscriptions Schema
-- Migration: 003_profiles_and_subscriptions.sql
-- Depends on: 001_initial_schema.sql, 002_shieldready_schema.sql
--
-- Adds:
--   1. profiles         → synced from auth.users via trigger
--   2. subscriptions    → Stripe subscription tracking
--   3. usage_tracking   → per-user feature usage for tier limits
-- ============================================================


-- ============================================================
-- TABLE 1: profiles
--
-- Auto-created when a user signs up via auth trigger.
-- Stores display info, avatar, and tier.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  email text,
  avatar_url text,
  company text,
  role text default 'user' check (role in ('user', 'admin', 'consultant')),
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise', 'agency')),
  stripe_customer_id text unique,
  onboarding_completed boolean not null default false,
  metadata jsonb default '{}'
);

create index idx_profiles_email on profiles(email);
create index idx_profiles_tier on profiles(tier);
create index idx_profiles_stripe on profiles(stripe_customer_id) where stripe_customer_id is not null;

-- RLS
alter table profiles enable row level security;

-- Users can read/update their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role full access
create policy "Service role full access on profiles"
  on profiles for all
  using (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$;

-- Trigger fires after insert on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated_at trigger
create trigger profiles_updated_at
  before update on profiles
  for each row execute function shieldready_set_updated_at();


-- ============================================================
-- TABLE 2: subscriptions
--
-- Tracks Stripe subscription state for each user.
-- One active subscription per user.
-- ============================================================

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_subscription_id text unique,
  stripe_price_id text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise', 'agency')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing', 'paused', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb default '{}'
);

create unique index idx_subscriptions_user_active
  on subscriptions(user_id) where status in ('active', 'trialing', 'past_due');
create index idx_subscriptions_stripe on subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on subscriptions(status);

-- RLS
alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role full access on subscriptions"
  on subscriptions for all
  using (true);

-- Updated_at trigger
create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function shieldready_set_updated_at();


-- ============================================================
-- TABLE 3: usage_tracking
--
-- Tracks feature usage per billing period for tier enforcement.
-- Reset each billing cycle via Stripe webhook.
-- ============================================================

create table if not exists usage_tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  api_scans integer not null default 0,
  ai_agent_runs integer not null default 0,
  documents_generated integer not null default 0,
  assessments_started integer not null default 0,
  metadata jsonb default '{}'
);

create unique index idx_usage_user_period
  on usage_tracking(user_id, period_start);

-- RLS
alter table usage_tracking enable row level security;

create policy "Users can view own usage"
  on usage_tracking for select
  using (auth.uid() = user_id);

create policy "Service role full access on usage_tracking"
  on usage_tracking for all
  using (true);


-- ============================================================
-- FUNCTION: increment_usage
--
-- Atomically increments a usage counter for the current period.
-- Creates the period row if it doesn't exist.
-- Usage: select increment_usage('api_scans');
-- ============================================================

create or replace function increment_usage(counter_name text, amount integer default 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  period timestamptz := date_trunc('month', now());
begin
  insert into usage_tracking (user_id, period_start, period_end)
  values (current_user_id, period, period + interval '1 month')
  on conflict (user_id, period_start) do nothing;

  execute format(
    'update usage_tracking set %I = %I + $1 where user_id = $2 and period_start = $3',
    counter_name, counter_name
  ) using amount, current_user_id, period;
end;
$$;
