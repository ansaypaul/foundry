-- Add fields for Taxonomy Generator v1
ALTER TABLE terms
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add constraints
ALTER TABLE terms
  DROP CONSTRAINT IF EXISTS check_term_status;

ALTER TABLE terms
  ADD CONSTRAINT check_term_status 
  CHECK (status IN ('active', 'inactive', 'archived'));

-- Add index for parent queries
CREATE INDEX IF NOT EXISTS idx_terms_parent_id ON terms(parent_id);
CREATE INDEX IF NOT EXISTS idx_terms_order ON terms(site_id, "order");

-- Comments
COMMENT ON COLUMN terms.parent_id IS 'Parent category for hierarchical taxonomy';
COMMENT ON COLUMN terms."order" IS 'Display order within site';
COMMENT ON COLUMN terms.status IS 'Category status (active, inactive, archived)';
