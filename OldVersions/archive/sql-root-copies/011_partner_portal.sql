-- Migration 010: C3PAO Partner Portal + Docker Proxy Event Ingestion
-- Adds tables for: C3PAO multi-tenant management, Docker proxy metadata events.
-- Data residency note: proxy_events stores metadata only — no prompt content.

-- ── Partner organizations ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_org_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_name     TEXT NOT NULL,
  docker_api_key  TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'trial')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_user_id, client_org_id)
);

-- ── Docker proxy event ingestion ───────────────────────────────────────────
-- Metadata only: timestamp, action, pattern_name, risk_level, request_id.
-- Prompt text, CUI content, and user data are NEVER stored here.

CREATE TABLE IF NOT EXISTS proxy_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN ('ALLOWED', 'BLOCKED', 'QUARANTINED')),
  risk_level    TEXT NOT NULL,
  pattern_name  TEXT,
  nist_control  TEXT,          -- e.g. "AC.L2-3.1.3"
  scan_ms       INTEGER,
  source        TEXT NOT NULL DEFAULT 'docker_proxy'
                  CHECK (source IN ('docker_proxy', 'cloud_api', 'mcp')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_partner_orgs_partner_user
  ON partner_organizations(partner_user_id);

CREATE INDEX IF NOT EXISTS idx_partner_orgs_client_org
  ON partner_organizations(client_org_id);

CREATE INDEX IF NOT EXISTS idx_proxy_events_org_created
  ON proxy_events(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proxy_events_action
  ON proxy_events(action);

CREATE INDEX IF NOT EXISTS idx_proxy_events_nist
  ON proxy_events(nist_control) WHERE nist_control IS NOT NULL;

-- ── Auto-update updated_at ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_orgs_updated_at ON partner_organizations;
CREATE TRIGGER trg_partner_orgs_updated_at
  BEFORE UPDATE ON partner_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE partner_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_events ENABLE ROW LEVEL SECURITY;

-- Partners see only their own client relationships
CREATE POLICY "partner_orgs_own_rows" ON partner_organizations
  FOR ALL USING (partner_user_id = auth.uid());

-- Org members see their org's proxy events
CREATE POLICY "proxy_events_own_org" ON proxy_events
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Docker proxy can insert via service role (bypasses RLS) —
-- Event ingestion API route uses supabaseAdmin client.

-- ── Partner-specific SPRS aggregate view ──────────────────────────────────

CREATE OR REPLACE VIEW partner_client_summary AS
SELECT
  po.partner_user_id,
  po.client_org_id,
  po.client_name,
  po.status,
  po.docker_api_key,
  po.created_at,
  COUNT(pe.id)                                          AS total_events,
  SUM(CASE WHEN pe.action = 'BLOCKED' THEN 1 ELSE 0 END)      AS blocked_count,
  SUM(CASE WHEN pe.action = 'QUARANTINED' THEN 1 ELSE 0 END)  AS quarantined_count,
  MAX(pe.created_at)                                    AS last_event_at
FROM partner_organizations po
LEFT JOIN proxy_events pe ON pe.org_id = po.client_org_id
GROUP BY
  po.partner_user_id,
  po.client_org_id,
  po.client_name,
  po.status,
  po.docker_api_key,
  po.created_at;
