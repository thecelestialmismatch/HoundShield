-- Partner program applications for MSPs and C3PAOs
-- Supports the Kaelus partner/reseller GTM motion

CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  client_count INTEGER DEFAULT 0,
  partner_type TEXT NOT NULL DEFAULT 'referral'
    CHECK (partner_type IN ('referral', 'reseller', 'technology')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_partner_applications_email ON partner_applications(email);
CREATE INDEX idx_partner_applications_status ON partner_applications(status);

-- RLS: only service role can read/write (admin-only table)
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on partner_applications"
  ON partner_applications FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_partner_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_applications_updated_at
  BEFORE UPDATE ON partner_applications
  FOR EACH ROW EXECUTE PROCEDURE update_partner_application_timestamp();
