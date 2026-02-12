-- Create site_blueprint table for Blueprint v1
CREATE TABLE IF NOT EXISTS site_blueprint (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Version
  version INTEGER NOT NULL,
  
  -- Blueprint JSON
  blueprint_json JSONB NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(site_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_blueprint_site_id ON site_blueprint(site_id);
CREATE INDEX IF NOT EXISTS idx_site_blueprint_version ON site_blueprint(site_id, version DESC);

-- Comments
COMMENT ON TABLE site_blueprint IS 'Versioned snapshots of site configuration (authors, taxonomy, pages, content types)';
COMMENT ON COLUMN site_blueprint.version IS 'Blueprint version number (auto-incremented per site)';
COMMENT ON COLUMN site_blueprint.blueprint_json IS 'Complete site blueprint snapshot (structured JSON)';
