-- Add fields for Authors Generator v1
-- These fields support the deterministic author generation system

ALTER TABLE authors
  ADD COLUMN IF NOT EXISTS role_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add constraints
ALTER TABLE authors
  DROP CONSTRAINT IF EXISTS check_author_status;

ALTER TABLE authors
  ADD CONSTRAINT check_author_status 
  CHECK (status IN ('active', 'inactive', 'archived'));

-- Add index for role queries
CREATE INDEX IF NOT EXISTS idx_authors_role_key ON authors(site_id, role_key);
CREATE INDEX IF NOT EXISTS idx_authors_status ON authors(status);

-- Comments
COMMENT ON COLUMN authors.role_key IS 'Author role in editorial team (editorial_lead, specialist_*, news_writer)';
COMMENT ON COLUMN authors.specialties IS 'Array of specialty tags (anime, manga, gaming, etc.)';
COMMENT ON COLUMN authors.is_ai IS 'True if generated/AI-managed profile, false if real human';
COMMENT ON COLUMN authors.status IS 'Author status (active, inactive, archived)';
