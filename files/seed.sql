-- ============================================================
-- LEAKWALL — DEV SEED DATA
-- Run after schema.sql in local Supabase (supabase db reset)
-- ============================================================

-- Seed org
insert into organizations (id, name, slug, plan, seat_count) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Agency', 'acme-agency', 'team', 8);

-- Seed members (no real auth.users in seed — use null user_id for dev)
insert into organization_members (id, org_id, user_id, email, display_name, role, status, joined_at) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', null, 'admin@acme.com',   'Alex Chen',     'admin',  'active', now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', null, 'sam@acme.com',     'Sam Rivera',    'member', 'active', now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', null, 'jordan@acme.com',  'Jordan Wu',     'member', 'active', now() - interval '20 days'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', null, 'morgan@acme.com',  'Morgan Patel',  'member', 'active', now() - interval '18 days'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', null, 'riley@acme.com',   'Riley Torres',  'member', 'active', now() - interval '14 days'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', null, 'casey@acme.com',   'Casey Kim',     'member', 'active', now() - interval '10 days'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', null, 'drew@acme.com',    'Drew Okafor',   'member', 'active', now() - interval '7 days'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', null, 'taylor@acme.com',  'Taylor Singh',  'member', 'invited', null);

-- Seed default policies
select create_default_policies(
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
);

-- Seed digest settings
update digest_settings set
  recipient_emails = array['admin@acme.com'],
  send_day = 1,
  send_hour_utc = 9
where org_id = '00000000-0000-0000-0000-000000000001';

-- Seed leak events (past 14 days of realistic activity)
insert into leak_events
  (org_id, member_id, ai_tool_name, severity, category, category_label, char_count, was_blocked, was_warned, was_dismissed, created_at)
values
  -- Week ago events
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ChatGPT',    'critical', 'api_key',     'AWS API Key',         42,  true,  true,  false, now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Gemini',     'high',     'source_code', 'Source Code',         890, false, true,  true,  now() - interval '11 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Claude',     'high',     'credit_card', 'Credit Card Number',  16,  true,  true,  false, now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'ChatGPT',    'medium',   'pii',         'Customer PII',        234, false, true,  false, now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Perplexity', 'low',      'email_address','Email Address',      24,  false, false, false, now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'ChatGPT',    'critical', 'password',    'Password',            18,  true,  true,  false, now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Copilot',    'high',     'source_code', 'Source Code',         1240,false, true,  true,  now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ChatGPT',    'medium',   'financial_data','Financial Data',    156, false, true,  true,  now() - interval '8 days'),
  -- This week events
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Gemini',     'critical', 'api_key',     'Stripe API Key',      56,  true,  true,  false, now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'ChatGPT',    'high',     'ssn',         'Social Security No.', 11,  true,  true,  false, now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Claude',     'medium',   'pii',         'Customer PII',        445, false, true,  false, now() - interval '4 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Perplexity', 'low',      'phone_number','Phone Number',        12,  false, false, false, now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'ChatGPT',    'high',     'source_code', 'Source Code',         2100,false, true,  true,  now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'ChatGPT',    'critical', 'password',    'Password',            22,  true,  true,  false, now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Copilot',    'medium',   'financial_data','Financial Data',    280, false, true,  false, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Gemini',     'high',     'credit_card', 'Credit Card Number',  16,  true,  true,  false, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ChatGPT',    'critical', 'api_key',     'GitHub API Token',    40,  true,  true,  false, now() - interval '2 hours');
