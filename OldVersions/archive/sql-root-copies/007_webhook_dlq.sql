-- Migration 007: Webhook Delivery Receipts + Dead-Letter Queue
-- Supports lib/integrations/webhook-dlq.ts

-- Delivery receipts: audit log of every outbound webhook attempt
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination       TEXT NOT NULL,
  url_hash          TEXT NOT NULL,          -- SHA-256 prefix of target URL (no PII)
  status            TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'dead_letter')),
  attempts          INTEGER NOT NULL DEFAULT 1,
  last_status_code  INTEGER,
  last_error        TEXT,
  delivered_at      TIMESTAMPTZ,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ops queries (filter by status, destination, date)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status      ON webhook_deliveries (status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_destination ON webhook_deliveries (destination);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at  ON webhook_deliveries (created_at DESC);

-- Dead-letter queue: permanently failed events awaiting manual replay
CREATE TABLE IF NOT EXISTS webhook_dlq (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  url_hash    TEXT NOT NULL,
  payload     JSONB NOT NULL,    -- full delivery payload for replay
  attempts    INTEGER NOT NULL,
  last_error  TEXT,
  replayed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_dlq_destination ON webhook_dlq (destination);
CREATE INDEX IF NOT EXISTS idx_webhook_dlq_created_at  ON webhook_dlq (created_at DESC);

-- RLS: service-role only (these tables are internal ops, not user-facing)
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_dlq        ENABLE ROW LEVEL SECURITY;

-- Allow service role full access; deny anon/authenticated by default
CREATE POLICY "service_role_only_deliveries"
  ON webhook_deliveries
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_dlq"
  ON webhook_dlq
  USING (auth.role() = 'service_role');

-- Auto-prune deliveries older than 90 days (keep DLQ forever until replayed)
COMMENT ON TABLE webhook_deliveries IS
  'Delivery receipts for all outbound webhooks. Prune rows older than 90 days via pg_cron.';
COMMENT ON TABLE webhook_dlq IS
  'Permanently failed webhook events. Retain until manually replayed or dismissed.';
