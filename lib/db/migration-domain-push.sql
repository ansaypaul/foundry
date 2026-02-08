-- Migration: Domain Push (Cloudflare + Vercel automation)
-- Adds columns to track the domain provisioning workflow

-- Add columns to domains table
ALTER TABLE domains
ADD COLUMN IF NOT EXISTS cloudflare_zone_id TEXT,
ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
ADD COLUMN IF NOT EXISTS domain_status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (domain_status IN ('draft', 'pushing', 'waiting_nameservers', 'dns_configured', 'vercel_pending', 'live', 'error')),
ADD COLUMN IF NOT EXISTS last_step TEXT,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS nameservers JSONB,
ADD COLUMN IF NOT EXISTS push_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS push_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster domain_status queries
CREATE INDEX IF NOT EXISTS idx_domains_domain_status ON domains(domain_status);

-- Create index for cloudflare_zone_id lookups
CREATE INDEX IF NOT EXISTS idx_domains_cloudflare_zone_id ON domains(cloudflare_zone_id) WHERE cloudflare_zone_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN domains.cloudflare_zone_id IS 'Cloudflare Zone ID after zone creation';
COMMENT ON COLUMN domains.vercel_project_id IS 'Vercel Project ID for domain attachment';
COMMENT ON COLUMN domains.domain_status IS 'Current status in the push workflow: draft, pushing, waiting_nameservers, dns_configured, vercel_pending, live, error';
COMMENT ON COLUMN domains.last_step IS 'Last step attempted (for debugging and resume)';
COMMENT ON COLUMN domains.last_error IS 'Error message if domain_status = error';
COMMENT ON COLUMN domains.nameservers IS 'Cloudflare nameservers to configure at registrar (JSON array)';
COMMENT ON COLUMN domains.push_started_at IS 'Timestamp when push domain was initiated';
COMMENT ON COLUMN domains.push_completed_at IS 'Timestamp when domain reached live status';
