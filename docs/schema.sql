-- ============================================================
-- LEAKWALL — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type leak_severity as enum ('low', 'medium', 'high', 'critical');
create type leak_category as enum (
  'api_key',
  'password',
  'credit_card',
  'ssn',
  'email_address',
  'phone_number',
  'source_code',
  'medical_record',
  'financial_data',
  'pii',
  'custom'
);
create type member_role as enum ('admin', 'member');
create type member_status as enum ('active', 'inactive', 'invited');
create type policy_action as enum ('block', 'warn', 'log_only');
create type plan_tier as enum ('free', 'pro', 'team', 'business', 'enterprise');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

create table organizations (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  plan            plan_tier not null default 'free',
  seat_count      int not null default 1,
  stripe_customer_id  text,
  stripe_subscription_id text,
  billing_email   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

create table organization_members (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  email           text not null,
  display_name    text,
  role            member_role not null default 'member',
  status          member_status not null default 'invited',
  invite_token    text unique default encode(gen_random_bytes(24), 'hex'),
  extension_token text unique default encode(gen_random_bytes(32), 'hex'), -- used by Chrome ext
  joined_at       timestamptz,
  last_active_at  timestamptz,
  created_at      timestamptz not null default now(),
  unique(org_id, email)
);

-- ============================================================
-- AI TOOLS REGISTRY
-- ============================================================

create table ai_tools (
  id          serial primary key,
  name        text not null,
  slug        text not null unique,
  domain      text not null,           -- e.g. 'chatgpt.com'
  url_pattern text not null,           -- regex for content script matching
  icon_url    text,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into ai_tools (name, slug, domain, url_pattern) values
  ('ChatGPT',     'chatgpt',     'chatgpt.com',      'https?://(www\.)?chatgpt\.com.*'),
  ('Claude',      'claude',      'claude.ai',         'https?://(www\.)?claude\.ai.*'),
  ('Gemini',      'gemini',      'gemini.google.com', 'https?://gemini\.google\.com.*'),
  ('Copilot',     'copilot',     'copilot.microsoft.com', 'https?://copilot\.microsoft\.com.*'),
  ('Perplexity',  'perplexity',  'perplexity.ai',    'https?://(www\.)?perplexity\.ai.*');

-- ============================================================
-- LEAK EVENTS (core table — privacy-first: no content stored)
-- ============================================================

create table leak_events (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  member_id       uuid not null references organization_members(id) on delete cascade,
  ai_tool_id      int references ai_tools(id),
  ai_tool_name    text not null,         -- denormalized for speed
  severity        leak_severity not null,
  category        leak_category not null,
  category_label  text not null,         -- human readable e.g. "AWS API Key"
  char_count      int,                   -- length of the flagged text (NOT the text itself)
  was_blocked     boolean not null default false,  -- true = extension blocked the paste
  was_warned      boolean not null default true,   -- true = extension showed a warning
  was_dismissed   boolean not null default false,  -- true = user dismissed warning and pasted anyway
  session_id      text,                  -- anonymous session for grouping within a browser session
  created_at      timestamptz not null default now()

  -- NOTE: The actual content of what was pasted is NEVER stored.
  -- Only metadata: what category was detected, how severe, which tool, which member.
  -- This is a core privacy guarantee. Do not add a content column.
);

-- ============================================================
-- POLICY RULES
-- ============================================================

create table policy_rules (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  category        leak_category not null,
  action          policy_action not null default 'warn',
  enabled         boolean not null default true,
  created_by      uuid references organization_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(org_id, category)
);

-- ============================================================
-- EMAIL DIGEST SETTINGS
-- ============================================================

create table digest_settings (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade unique,
  enabled         boolean not null default true,
  frequency       text not null default 'weekly',   -- 'daily' | 'weekly'
  send_day        int not null default 1,            -- 0=Sun, 1=Mon ... 6=Sat
  send_hour_utc   int not null default 9,            -- 0–23
  recipient_emails text[] not null default '{}',     -- admin emails
  last_sent_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- WEEKLY DIGEST LOG (audit trail of emails sent)
-- ============================================================

create table digest_log (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  total_events    int not null default 0,
  critical_events int not null default 0,
  high_events     int not null default 0,
  active_members  int not null default 0,
  resend_message_id text,
  sent_at         timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_leak_events_org_id       on leak_events(org_id);
create index idx_leak_events_member_id    on leak_events(member_id);
create index idx_leak_events_created_at   on leak_events(created_at desc);
create index idx_leak_events_severity     on leak_events(severity);
create index idx_leak_events_org_created  on leak_events(org_id, created_at desc);
create index idx_org_members_org_id       on organization_members(org_id);
create index idx_org_members_user_id      on organization_members(user_id);
create index idx_org_members_ext_token    on organization_members(extension_token);
create index idx_policy_rules_org_id      on policy_rules(org_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();

create trigger trg_policy_rules_updated_at
  before update on policy_rules
  for each row execute function set_updated_at();

create trigger trg_digest_settings_updated_at
  before update on digest_settings
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organizations         enable row level security;
alter table organization_members  enable row level security;
alter table leak_events           enable row level security;
alter table policy_rules          enable row level security;
alter table digest_settings       enable row level security;
alter table digest_log            enable row level security;

-- Helper: is the calling user a member of the given org?
create or replace function auth_user_org_id()
returns uuid language sql security definer stable as $$
  select org_id
  from organization_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Helper: is the calling user an admin?
create or replace function auth_user_is_admin(target_org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from organization_members
    where org_id = target_org_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- ORGANIZATIONS: members can read their own org; admins can update
create policy "members_read_own_org"
  on organizations for select
  using (id = auth_user_org_id());

create policy "admins_update_org"
  on organizations for update
  using (auth_user_is_admin(id));

-- ORGANIZATION_MEMBERS: members can read their own org's members
create policy "members_read_org_members"
  on organization_members for select
  using (org_id = auth_user_org_id());

create policy "admins_manage_members"
  on organization_members for all
  using (auth_user_is_admin(org_id));

-- LEAK_EVENTS: members can read their org's events; extension inserts via service role
create policy "members_read_org_events"
  on leak_events for select
  using (org_id = auth_user_org_id());

-- Extension uses service_role key so bypasses RLS for inserts — no insert policy needed.
-- Admin dashboard reads only — this is intentional.

-- POLICY_RULES: admins manage; members read
create policy "members_read_policies"
  on policy_rules for select
  using (org_id = auth_user_org_id());

create policy "admins_manage_policies"
  on policy_rules for all
  using (auth_user_is_admin(org_id));

-- DIGEST_SETTINGS: admins manage
create policy "admins_manage_digest_settings"
  on digest_settings for all
  using (auth_user_is_admin(org_id));

create policy "members_read_digest_settings"
  on digest_settings for select
  using (org_id = auth_user_org_id());

-- DIGEST_LOG: admins read
create policy "admins_read_digest_log"
  on digest_log for select
  using (auth_user_is_admin(org_id));

-- ============================================================
-- AGGREGATE VIEW (safe, no PII)
-- ============================================================

create or replace view org_weekly_stats as
select
  o.id                                  as org_id,
  o.name                                as org_name,
  count(le.id)                          as total_events,
  count(le.id) filter (
    where le.severity = 'critical')     as critical_events,
  count(le.id) filter (
    where le.severity = 'high')         as high_events,
  count(le.id) filter (
    where le.severity = 'medium')       as medium_events,
  count(le.id) filter (
    where le.severity = 'low')          as low_events,
  count(le.id) filter (
    where le.was_blocked = true)        as blocked_events,
  count(le.id) filter (
    where le.was_dismissed = true)      as dismissed_events,
  count(distinct le.member_id)          as active_members,
  count(distinct le.ai_tool_name)       as tools_used
from organizations o
left join leak_events le
  on le.org_id = o.id
  and le.created_at >= now() - interval '7 days'
group by o.id, o.name;

-- ============================================================
-- DEFAULT POLICY RULES (inserted when org is created)
-- ============================================================

create or replace function create_default_policies(p_org_id uuid, p_created_by uuid)
returns void language plpgsql as $$
begin
  insert into policy_rules (org_id, category, action, created_by) values
    (p_org_id, 'api_key',        'block',    p_created_by),
    (p_org_id, 'password',       'block',    p_created_by),
    (p_org_id, 'credit_card',    'block',    p_created_by),
    (p_org_id, 'ssn',            'block',    p_created_by),
    (p_org_id, 'source_code',    'warn',     p_created_by),
    (p_org_id, 'medical_record', 'warn',     p_created_by),
    (p_org_id, 'financial_data', 'warn',     p_created_by),
    (p_org_id, 'pii',            'warn',     p_created_by),
    (p_org_id, 'email_address',  'log_only', p_created_by),
    (p_org_id, 'phone_number',   'log_only', p_created_by)
  on conflict (org_id, category) do nothing;

  insert into digest_settings (org_id) values (p_org_id)
  on conflict (org_id) do nothing;
end;
$$;
