-- Migration: Add active_blueprint_version to sites
-- Description: Track which blueprint version is currently active for a site

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS active_blueprint_version INT4 NULL;

COMMENT ON COLUMN sites.active_blueprint_version IS 'Currently active blueprint version number (references site_blueprint.version)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_active_blueprint ON sites(id, active_blueprint_version);
