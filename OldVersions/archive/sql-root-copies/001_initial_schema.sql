-- Compliance Firewall Agent - Database Schema
-- Run this in Supabase SQL Editor (free tier)

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- COMPLIANCE EVENTS
-- Core table logging every intercepted LLM request
-- ============================================
create table compliance_events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  user_id text not null,
  prompt_hash text not null,           -- SHA-256 of the original prompt
  destination_provider text,            -- e.g. 'openai', 'anthropic', 'google'
  risk_level text not null check (risk_level in ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  classifications text[] not null default '{}', -- array of detected categories
  action_taken text not null check (action_taken in ('ALLOWED', 'BLOCKED', 'QUARANTINED')),
  confidence_score real not null default 0,
  detected_entities jsonb not null default '[]',
  seed_hash text,                       -- cryptographic anchor hash
  processing_time_ms integer,
  metadata jsonb default '{}'
);

create index idx_events_created_at on compliance_events(created_at desc);
create index idx_events_risk_level on compliance_events(risk_level);
create index idx_events_user_id on compliance_events(user_id);
create index idx_events_action on compliance_events(action_taken);

-- ============================================
-- QUARANTINE QUEUE
-- Holds blocked/quarantined prompts for review
-- ============================================
create table quarantine_queue (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  event_id uuid not null references compliance_events(id) on delete cascade,
  prompt_content_encrypted text not null, -- AES-256 encrypted prompt
  encryption_iv text not null,            -- initialization vector
  detected_entities jsonb not null default '[]',
  review_status text not null default 'PENDING' check (review_status in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  reviewer_id text,
  reviewed_at timestamptz,
  resolution_notes text,
  priority integer not null default 0
);

create index idx_quarantine_status on quarantine_queue(review_status);
create index idx_quarantine_created on quarantine_queue(created_at desc);
create index idx_quarantine_priority on quarantine_queue(priority desc);

-- ============================================
-- POLICY RULES
-- Configurable detection rules
-- ============================================
create table policy_rules (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category text not null check (category in ('PII', 'FINANCIAL', 'STRATEGIC', 'IP')),
  name text not null,
  description text,
  pattern text not null,                -- regex pattern
  pattern_type text not null default 'REGEX' check (pattern_type in ('REGEX', 'KEYWORD', 'SEMANTIC')),
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  threshold real not null default 0.8,
  action text not null default 'BLOCK' check (action in ('ALLOW', 'WARN', 'BLOCK', 'QUARANTINE')),
  is_active boolean not null default true,
  seed_hash text                        -- cryptographic anchor
);

create index idx_rules_category on policy_rules(category);
create index idx_rules_active on policy_rules(is_active) where is_active = true;

-- ============================================
-- AUDIT REPORTS
-- Generated compliance reports
-- ============================================
create table audit_reports (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  total_events integer not null default 0,
  total_violations integer not null default 0,
  events_by_risk jsonb not null default '{}',
  events_by_category jsonb not null default '{}',
  events_by_action jsonb not null default '{}',
  report_data jsonb not null default '{}',
  seed_hash text                        -- cryptographic anchor
);

create index idx_reports_created on audit_reports(created_at desc);

-- ============================================
-- HITL APPROVALS
-- Human-in-the-loop approval tracking
-- ============================================
create table hitl_approvals (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  operation_type text not null,         -- e.g. 'POLICY_UPDATE', 'KEY_ROTATION', 'QUARANTINE_RELEASE'
  operation_details jsonb not null default '{}',
  requested_by text not null,
  approved_by text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  resolved_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  risk_assessment text,
  justification text
);

create index idx_hitl_status on hitl_approvals(status);
create index idx_hitl_expires on hitl_approvals(expires_at) where status = 'PENDING';

-- ============================================
-- SEED ANCHORS
-- Cryptographic integrity chain
-- ============================================
create table seed_anchors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  entity_type text not null,            -- 'EVENT', 'POLICY', 'REPORT', 'HITL'
  entity_id uuid not null,
  content_hash text not null,           -- SHA-256 of the content
  previous_hash text,                   -- chain link to prior seed
  merkle_root text,                     -- batch merkle root
  verification_status text not null default 'VALID'
);

create index idx_seeds_entity on seed_anchors(entity_type, entity_id);
create index idx_seeds_hash on seed_anchors(content_hash);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table compliance_events enable row level security;
alter table quarantine_queue enable row level security;
alter table policy_rules enable row level security;
alter table audit_reports enable row level security;
alter table hitl_approvals enable row level security;
alter table seed_anchors enable row level security;

-- Service role has full access (used by API routes)
create policy "Service role full access" on compliance_events for all using (true);
create policy "Service role full access" on quarantine_queue for all using (true);
create policy "Service role full access" on policy_rules for all using (true);
create policy "Service role full access" on audit_reports for all using (true);
create policy "Service role full access" on hitl_approvals for all using (true);
create policy "Service role full access" on seed_anchors for all using (true);

-- ============================================
-- DEFAULT POLICY RULES
-- Pre-populated detection patterns
-- ============================================
insert into policy_rules (category, name, pattern, pattern_type, risk_level, action) values
  ('PII', 'Email addresses', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'REGEX', 'MEDIUM', 'QUARANTINE'),
  ('PII', 'US Social Security Numbers', '\b\d{3}-\d{2}-\d{4}\b', 'REGEX', 'CRITICAL', 'BLOCK'),
  ('PII', 'Phone numbers', '\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', 'REGEX', 'MEDIUM', 'QUARANTINE'),
  ('PII', 'US addresses', '\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|court|ct|lane|ln)\b', 'REGEX', 'MEDIUM', 'QUARANTINE'),
  ('PII', 'Credit card numbers', '\b(?:\d{4}[-\s]?){3}\d{4}\b', 'REGEX', 'CRITICAL', 'BLOCK'),
  ('PII', 'Passport numbers', '\b[A-Z]{1,2}\d{6,9}\b', 'REGEX', 'HIGH', 'BLOCK'),
  ('FINANCIAL', 'Bank account numbers', '\b\d{8,17}\b', 'REGEX', 'HIGH', 'QUARANTINE'),
  ('FINANCIAL', 'Revenue figures', '(?i)\b(?:revenue|earnings|profit|loss|ebitda|arpu|mrr|arr)\s*[:=]?\s*\$?\d', 'REGEX', 'HIGH', 'BLOCK'),
  ('FINANCIAL', 'Routing numbers', '\b\d{9}\b', 'REGEX', 'HIGH', 'QUARANTINE'),
  ('STRATEGIC', 'M&A keywords', '(?i)\b(?:acquisition|merger|due diligence|letter of intent|LOI|term sheet|buyout|acqui-?hire)\b', 'KEYWORD', 'CRITICAL', 'BLOCK'),
  ('STRATEGIC', 'Pricing strategy', '(?i)\b(?:pricing strategy|price increase|margin target|competitive pricing|price point)\b', 'KEYWORD', 'HIGH', 'QUARANTINE'),
  ('STRATEGIC', 'Roadmap references', '(?i)\b(?:product roadmap|feature roadmap|strategic plan|go-to-market|GTM strategy)\b', 'KEYWORD', 'MEDIUM', 'QUARANTINE'),
  ('IP', 'API keys', '(?i)(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer)\s*[:=]\s*["\x27]?[\w-]{20,}', 'REGEX', 'CRITICAL', 'BLOCK'),
  ('IP', 'Connection strings', '(?i)(?:mongodb|postgres|mysql|redis|amqp):\/\/[^\s]+', 'REGEX', 'CRITICAL', 'BLOCK'),
  ('IP', 'Private keys', '-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----', 'REGEX', 'CRITICAL', 'BLOCK'),
  ('IP', 'AWS credentials', '(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}', 'REGEX', 'CRITICAL', 'BLOCK');
