-- Migration: Expand setup_status enum for progressive onboarding
-- Description: Add blueprint_applied and enriched states

-- Step 1: Drop existing constraint FIRST (to allow UPDATE)
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_setup_status;

ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS sites_setup_status_check;

-- Step 2: Migrate existing 'configured' sites to 'blueprint_applied'
UPDATE sites
  SET setup_status = 'blueprint_applied'
  WHERE setup_status = 'configured';

-- Step 3: Add new constraint with expanded enum
ALTER TABLE sites
  ADD CONSTRAINT sites_setup_status_check 
  CHECK (setup_status IN ('draft', 'blueprint_applied', 'enriched'));

COMMENT ON COLUMN sites.setup_status IS 'Setup status: draft (initial), blueprint_applied (structure created), enriched (content enriched)';
