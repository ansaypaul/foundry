-- Migration: Add AI Bootstrap foundation fields to sites table
-- This prepares Foundry for the AI Site Bootstrap feature
-- DO NOT DROP OR RECREATE THE TABLE - Only add new columns

-- Add new columns to sites table
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country VARCHAR(10) NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS site_type VARCHAR(50) NOT NULL DEFAULT 'niche_passion',
  ADD COLUMN IF NOT EXISTS automation_level VARCHAR(50) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS setup_status VARCHAR(50) NOT NULL DEFAULT 'draft';

-- Add constraints for site_type
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_site_type;

ALTER TABLE sites
  ADD CONSTRAINT check_site_type 
  CHECK (site_type IN (
    'niche_passion',
    'news_media',
    'gaming_popculture',
    'affiliate_guides',
    'lifestyle'
  ));

-- Add constraints for automation_level
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_automation_level;

ALTER TABLE sites
  ADD CONSTRAINT check_automation_level 
  CHECK (automation_level IN ('manual', 'ai_assisted', 'ai_auto'));

-- Add constraints for setup_status
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_setup_status;

ALTER TABLE sites
  ADD CONSTRAINT check_setup_status 
  CHECK (setup_status IN ('draft', 'configured'));

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_sites_setup_status ON sites(setup_status);
CREATE INDEX IF NOT EXISTS idx_sites_site_type ON sites(site_type);
CREATE INDEX IF NOT EXISTS idx_sites_language ON sites(language);

-- Update existing sites to have 'configured' status (they're already set up)
UPDATE sites 
SET setup_status = 'configured' 
WHERE setup_status = 'draft';

-- Comments for documentation
COMMENT ON COLUMN sites.language IS 'Site primary language (ISO 639-1 code, e.g., en, fr, nl)';
COMMENT ON COLUMN sites.country IS 'Site target country (ISO 3166-1 alpha-2 code, e.g., US, FR, BE)';
COMMENT ON COLUMN sites.site_type IS 'Type of site for content strategy (niche_passion, news_media, gaming_popculture, affiliate_guides, lifestyle)';
COMMENT ON COLUMN sites.automation_level IS 'Level of AI automation (manual, ai_assisted, ai_auto)';
COMMENT ON COLUMN sites.description IS 'Short description of the site niche and purpose';
COMMENT ON COLUMN sites.setup_status IS 'Site configuration status (draft = created but not configured, configured = ready with blueprint applied)';
