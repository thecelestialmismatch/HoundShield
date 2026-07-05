-- ============================================================
-- Migration 022: Brain AI account-data consent (opt-in, revocable)
-- Date: 2026-07-05
-- Adds an explicit, per-user consent flag that governs whether Brain AI may
-- access the signed-in customer's own account data (SPRS posture, assessment
-- progress, $499 report order status) to personalize guidance.
--
-- Legal/privacy posture:
--   • Default is FALSE — Brain AI accesses NOTHING about the customer until they
--     explicitly opt in. This is the "ask permission" gate.
--   • Consent is revocable: setting it back to false immediately withdraws access.
--   • The flag lives on the user's own profile row. The existing "Users can update
--     own profile" RLS policy (migration 003, WITH CHECK auth.uid() = id) already
--     restricts a user to toggling ONLY their own consent — no cross-user writes.
--   • Consent covers the user's OWN data only. Brain AI never receives another
--     customer's data regardless of this flag (enforced in application code +
--     own-row RLS on every read path).
-- Additive only; no edits to prior migrations.
-- ============================================================

alter table profiles
  add column if not exists brain_ai_data_consent boolean not null default false;

alter table profiles
  add column if not exists brain_ai_consent_updated_at timestamptz;

comment on column profiles.brain_ai_data_consent is
  'Opt-in (default false): may Brain AI access THIS user''s own account data (SPRS posture, assessment progress, report order status) to personalize guidance. Revocable. Never grants access to any other customer''s data.';

comment on column profiles.brain_ai_consent_updated_at is
  'Timestamp of the last change to brain_ai_data_consent — the auditable record of when consent was granted or withdrawn.';
