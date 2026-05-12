-- ============================================================
-- Add 'growth' tier to subscriptions and profiles
-- Migration: 004_add_growth_tier.sql
-- Depends on: 003_profiles_and_subscriptions.sql
--
-- Pricing: Starter FREE | Pro $199 | Growth $499 | Enterprise $999 | Agency $2,499
-- 'growth' sits between 'pro' and 'enterprise' — added here as pricing was
-- updated in Gap 4 (sprint 1).
-- ============================================================

-- Drop and re-add the tier check on subscriptions to include 'growth'
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_tier_check
    CHECK (tier IN ('free', 'pro', 'growth', 'enterprise', 'agency'));

-- Drop and re-add the tier check on profiles to include 'growth'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_tier_check
    CHECK (tier IN ('free', 'pro', 'growth', 'enterprise', 'agency'));
