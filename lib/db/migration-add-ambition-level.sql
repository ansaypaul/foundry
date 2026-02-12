-- Add ambition_level to sites table
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS ambition_level VARCHAR(20) NOT NULL DEFAULT 'auto';

-- Add constraint
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_ambition_level;

ALTER TABLE sites
  ADD CONSTRAINT check_ambition_level 
  CHECK (ambition_level IN ('auto', 'starter', 'growth', 'factory'));

COMMENT ON COLUMN sites.ambition_level IS 'Site ambition level (auto, starter, growth, factory)';
