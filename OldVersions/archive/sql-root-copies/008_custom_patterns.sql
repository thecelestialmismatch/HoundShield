-- Migration 008: Per-Org Custom Pattern Library
-- Supports lib/classifier/custom-patterns.ts and /api/v1/patterns

CREATE TABLE IF NOT EXISTS org_patterns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      TEXT NOT NULL,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  pattern     TEXT NOT NULL CHECK (char_length(pattern) BETWEEN 1 AND 1000),
  risk_level  TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
  description TEXT CHECK (char_length(description) <= 500),
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each org can have up to 200 patterns (prevent abuse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_patterns_org_name ON org_patterns (org_id, name);
CREATE INDEX IF NOT EXISTS idx_org_patterns_org_enabled   ON org_patterns (org_id, enabled);

-- RLS: users see and manage only their org's patterns
ALTER TABLE org_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_patterns_select"
  ON org_patterns FOR SELECT
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "org_patterns_insert"
  ON org_patterns FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "org_patterns_update"
  ON org_patterns FOR UPDATE
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

CREATE POLICY "org_patterns_delete"
  ON org_patterns FOR DELETE
  USING (
    org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
    OR org_id = auth.uid()::text
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_org_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_patterns_updated_at
  BEFORE UPDATE ON org_patterns
  FOR EACH ROW EXECUTE FUNCTION update_org_patterns_updated_at();

COMMENT ON TABLE org_patterns IS
  'Per-org custom regex detection patterns. Max 200 per org. Cached in-memory for 5 minutes.';
