-- Migration: Add 'author' entity type to seo_meta
-- Description: Extend seo_meta to support author SEO metadata

-- Drop existing constraint if exists
ALTER TABLE seo_meta
  DROP CONSTRAINT IF EXISTS seo_meta_entity_type_check;

-- Add new constraint with 'author' support
ALTER TABLE seo_meta
  ADD CONSTRAINT seo_meta_entity_type_check 
  CHECK (entity_type IN ('content', 'term', 'site', 'author'));

-- Update comments
COMMENT ON TABLE seo_meta IS 'Métadonnées SEO centralisées pour toutes les entités (content, terms, sites, authors)';
COMMENT ON COLUMN seo_meta.entity_type IS 'Type d''entité : content, term, site, author';
