-- ====================================
-- RETROCOMPATIBILITY MIGRATION
-- Migrate old content_type_key to new content_type_id
-- ====================================

-- This migration maps existing articles from old content_types table
-- to new editorial_content_types table

-- ====================================
-- 1. Create mapping function
-- ====================================

CREATE OR REPLACE FUNCTION map_content_type_key_to_id(old_key TEXT)
RETURNS UUID AS $$
DECLARE
  mapped_key TEXT;
  result_id UUID;
BEGIN
  -- Normalize and map old keys to new canonical keys
  mapped_key := CASE
    -- Top 10 / Listicle variants
    WHEN old_key ~* '(top.*10|list.*10|listicle|classement)' THEN 'top10'
    
    -- News / Actualité variants
    WHEN old_key ~* '(news|actualit|breaking|flash)' THEN 'news'
    
    -- Guide / Tutorial variants
    WHEN old_key ~* '(guide|tuto(?!rial)|ultimate.*guide|complete.*guide)' THEN 'guide'
    
    -- How-To / Tutorial variants
    WHEN old_key ~* '(how.*to|tutorial|step.*by.*step)' THEN 'howto'
    
    -- Review / Test variants
    WHEN old_key ~* '(review|test|critique|evaluation)' THEN 'review'
    
    -- Comparison variants
    WHEN old_key ~* '(compar|versus|vs\.|face.*off)' THEN 'comparison'
    
    -- Interview variants
    WHEN old_key ~* '(interview|portrait|rencontre)' THEN 'interview'
    
    -- Explainer variants
    WHEN old_key ~* '(explain|decryptage|analyse)' THEN 'explainer'
    
    -- Opinion / Editorial variants
    WHEN old_key ~* '(opinion|editorial|tribune|edito)' THEN 'opinion'
    
    -- Default: evergreen for long-form or unrecognized
    ELSE 'evergreen'
  END;
  
  -- Get ID for mapped key
  SELECT id INTO result_id
  FROM editorial_content_types
  WHERE key = mapped_key
  AND is_active = true
  LIMIT 1;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 2. Log unmapped types for review
-- ====================================

-- Create temporary table to log unmapped types
CREATE TEMP TABLE IF NOT EXISTS migration_unmapped_types (
  old_key TEXT,
  count INTEGER,
  example_title TEXT,
  mapped_to TEXT
);

-- Insert unmapped types
INSERT INTO migration_unmapped_types (old_key, count, example_title, mapped_to)
SELECT 
  content_type_key as old_key,
  COUNT(*) as count,
  MIN(title) as example_title,
  CASE
    WHEN map_content_type_key_to_id(content_type_key) IS NULL THEN 'NOT_MAPPED'
    ELSE (SELECT key FROM editorial_content_types WHERE id = map_content_type_key_to_id(content_type_key))
  END as mapped_to
FROM content
WHERE content_type_key IS NOT NULL
AND content_type_id IS NULL
GROUP BY content_type_key
ORDER BY count DESC;

-- Display unmapped types
DO $$
DECLARE
  unmapped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM migration_unmapped_types;
  
  IF unmapped_count > 0 THEN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION MAPPING PREVIEW';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Found % distinct content_type_key values to migrate', unmapped_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Review the mapping in migration_unmapped_types table:';
    RAISE NOTICE 'SELECT * FROM migration_unmapped_types ORDER BY count DESC;';
    RAISE NOTICE '';
  END IF;
END $$;

-- ====================================
-- 3. Migrate articles to new system
-- ====================================

-- Update all articles with content_type_key to content_type_id
UPDATE content
SET 
  content_type_id = map_content_type_key_to_id(content_type_key),
  updated_at = NOW()
WHERE content_type_key IS NOT NULL
AND content_type_id IS NULL
AND map_content_type_key_to_id(content_type_key) IS NOT NULL;

-- ====================================
-- 4. Handle unmapped articles (fallback to evergreen)
-- ====================================

-- For articles that couldn't be mapped, use evergreen as fallback
UPDATE content
SET 
  content_type_id = (SELECT id FROM editorial_content_types WHERE key = 'evergreen' LIMIT 1),
  updated_at = NOW()
WHERE content_type_key IS NOT NULL
AND content_type_id IS NULL;

-- ====================================
-- 5. Verify migration
-- ====================================

DO $$
DECLARE
  total_articles INTEGER;
  migrated_articles INTEGER;
  unmigrated_articles INTEGER;
BEGIN
  -- Count total articles with content_type_key
  SELECT COUNT(*) INTO total_articles
  FROM content
  WHERE content_type_key IS NOT NULL;
  
  -- Count migrated articles
  SELECT COUNT(*) INTO migrated_articles
  FROM content
  WHERE content_type_key IS NOT NULL
  AND content_type_id IS NOT NULL;
  
  -- Count unmigrated articles
  SELECT COUNT(*) INTO unmigrated_articles
  FROM content
  WHERE content_type_key IS NOT NULL
  AND content_type_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'MIGRATION RESULTS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total articles with content_type_key: %', total_articles;
  RAISE NOTICE 'Successfully migrated: %', migrated_articles;
  RAISE NOTICE 'Failed to migrate: %', unmigrated_articles;
  RAISE NOTICE '';
  
  IF unmigrated_articles > 0 THEN
    RAISE WARNING 'Some articles could not be migrated. Review manually.';
  ELSE
    RAISE NOTICE 'All articles successfully migrated! ✓';
  END IF;
  
  RAISE NOTICE '==========================================';
END $$;

-- ====================================
-- 6. Post-migration verification queries
-- ====================================

-- Check migration mapping distribution
SELECT 
  ect.key as new_key,
  ect.label,
  COUNT(c.id) as article_count
FROM content c
JOIN editorial_content_types ect ON ect.id = c.content_type_id
WHERE c.content_type_key IS NOT NULL
GROUP BY ect.key, ect.label
ORDER BY article_count DESC;

-- Check for articles still needing migration
SELECT COUNT(*) as unmigrated_count
FROM content
WHERE content_type_key IS NOT NULL
AND content_type_id IS NULL;

-- ====================================
-- 7. Cleanup (optional - run after verification)
-- ====================================

-- IMPORTANT: Run these queries ONLY after verifying the migration is successful
-- Uncomment and run manually when ready

-- Mark old content_type_key as deprecated (don't drop yet)
-- COMMENT ON COLUMN content.content_type_key IS 'DEPRECATED: Use content_type_id instead. DO NOT USE.';

-- Drop the mapping function (cleanup)
-- DROP FUNCTION IF EXISTS map_content_type_key_to_id(TEXT);

-- ====================================
-- Notes
-- ====================================

-- This migration is SAFE to run multiple times (idempotent)
-- Articles already migrated (content_type_id IS NOT NULL) are skipped
-- Use migration_unmapped_types table to review mapping before committing
-- Keep old content_types table for reference until all systems are updated
