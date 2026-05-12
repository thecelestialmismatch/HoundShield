-- Migration 009: Zero-Trust Rules + SSO Configs
-- Supports lib/gateway/zero-trust.ts and lib/auth/saml.ts

-- ---------------------------------------------------------------------------
-- Zero-Trust allowlist rules
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS zero_trust_rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     TEXT NOT NULL,
  rule_type  TEXT NOT NULL CHECK (rule_type IN ('provider', 'model', 'team', 'time_window')),
  value      TEXT NOT NULL CHECK (char_length(value) BETWEEN 1 AND 200),
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zero_trust_rules_org_enabled
  ON zero_trust_rules (org_id, enabled);

-- RLS: org-scoped
ALTER TABLE zero_trust_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zero_trust_rules_select"
  ON zero_trust_rules FOR SELECT
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "zero_trust_rules_insert"
  ON zero_trust_rules FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "zero_trust_rules_update"
  ON zero_trust_rules FOR UPDATE
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "zero_trust_rules_delete"
  ON zero_trust_rules FOR DELETE
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

COMMENT ON TABLE zero_trust_rules IS
  'Zero-trust allowlist: when KAELUS_ZERO_TRUST=true, all AI requests denied unless matched here.';

-- ---------------------------------------------------------------------------
-- SSO configurations (per org/domain)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sso_configs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       TEXT NOT NULL,
  provider     TEXT NOT NULL CHECK (provider IN ('okta', 'azure_ad', 'jumpcloud', 'generic')),
  domain       TEXT NOT NULL,   -- e.g. "acme.com" — used for email-domain auto-discovery
  metadata_url TEXT,            -- IdP metadata URL for auto-sync
  enabled      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One SSO config per domain (domain must be globally unique to avoid IdP ambiguity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sso_configs_domain  ON sso_configs (domain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sso_configs_org_id  ON sso_configs (org_id);
CREATE INDEX IF NOT EXISTS idx_sso_configs_enabled        ON sso_configs (domain, enabled);

-- RLS: org-scoped (admin only in practice — enforced at API layer)
ALTER TABLE sso_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sso_configs_select"
  ON sso_configs FOR SELECT
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "sso_configs_insert"
  ON sso_configs FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "sso_configs_update"
  ON sso_configs FOR UPDATE
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

-- Service role can read all (needed for domain-based SSO discovery at login time)
CREATE POLICY "sso_configs_service_role_select"
  ON sso_configs FOR SELECT
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sso_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sso_configs_updated_at
  BEFORE UPDATE ON sso_configs
  FOR EACH ROW EXECUTE FUNCTION update_sso_configs_updated_at();

COMMENT ON TABLE sso_configs IS
  'SAML 2.0 SSO configurations. One per org. Domain must be globally unique.';
