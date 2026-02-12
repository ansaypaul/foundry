-- Create content_types table for Content Types Generator v1
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Type definition
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template rules (JSON)
  rules_json JSONB NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(site_id, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_types_site_id ON content_types(site_id);
CREATE INDEX IF NOT EXISTS idx_content_types_key ON content_types(site_id, key);
CREATE INDEX IF NOT EXISTS idx_content_types_status ON content_types(status);

-- Comments
COMMENT ON TABLE content_types IS 'Content type templates for sites (news, review, guide, etc.)';
COMMENT ON COLUMN content_types.key IS 'Unique identifier for the content type (news, review_test, feature_dossier, etc.)';
COMMENT ON COLUMN content_types.rules_json IS 'JSON rules for content generation and editing (length, structure, constraints)';

-- Add trigger for updated_at
CREATE TRIGGER update_content_types_updated_at 
  BEFORE UPDATE ON content_types
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
