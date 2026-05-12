-- Blockchain anchor records for compliance event tamper-proof evidence
-- Links compliance_events to Base L2 transaction hashes

CREATE TABLE IF NOT EXISTS blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES compliance_events(id) ON DELETE CASCADE,
  event_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'base-sepolia'
    CHECK (chain IN ('base', 'base-sepolia')),
  block_number TEXT,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blockchain_anchors_event_id ON blockchain_anchors(event_id);
CREATE INDEX idx_blockchain_anchors_tx_hash ON blockchain_anchors(tx_hash);
CREATE INDEX idx_blockchain_anchors_chain ON blockchain_anchors(chain);

-- RLS: users can read their own anchors, service role can write
ALTER TABLE blockchain_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blockchain anchors"
  ON blockchain_anchors FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM compliance_events
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on blockchain_anchors"
  ON blockchain_anchors FOR ALL
  USING (auth.role() = 'service_role');
