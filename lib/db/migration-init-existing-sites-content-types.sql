-- ====================================
-- Initialize Content Types for Existing Sites
-- ====================================
-- This script activates all available content types for existing sites
-- that don't have any content type settings yet

DO $$
DECLARE
  site_record RECORD;
  content_type_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Initializing Content Types for Existing Sites';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  
  -- Loop through all sites that don't have any content type settings
  FOR site_record IN 
    SELECT s.id, s.name, s.site_type
    FROM sites s
    WHERE NOT EXISTS (
      SELECT 1 
      FROM site_content_type_settings scts 
      WHERE scts.site_id = s.id
    )
  LOOP
    RAISE NOTICE 'Processing site: % (%, type: %)', 
      site_record.name, 
      site_record.id, 
      COALESCE(site_record.site_type, 'unknown');
    
    -- Insert all active content types for this site
    FOR content_type_record IN
      SELECT id, key, label
      FROM editorial_content_types
      WHERE is_active = true
      ORDER BY key
    LOOP
      INSERT INTO site_content_type_settings (
        site_id,
        content_type_id,
        is_enabled,
        created_at,
        updated_at
      ) VALUES (
        site_record.id,
        content_type_record.id,
        true,
        NOW(),
        NOW()
      );
      
      inserted_count := inserted_count + 1;
      
      RAISE NOTICE '  ✓ Activated: % (%)', 
        content_type_record.label, 
        content_type_record.key;
    END LOOP;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total content type settings created: %', inserted_count;
  RAISE NOTICE '';
  
  IF inserted_count = 0 THEN
    RAISE NOTICE 'No sites needed initialization. All sites already have content type settings.';
  ELSE
    RAISE NOTICE 'Sites initialized successfully! ✓';
  END IF;
  
  RAISE NOTICE '==========================================';
END $$;

-- ====================================
-- Verification Query
-- ====================================
-- Show all sites with their activated content types count

SELECT 
  s.id,
  s.name,
  s.site_type,
  COUNT(scts.id) as activated_types_count,
  STRING_AGG(ect.key, ', ' ORDER BY ect.key) as activated_types
FROM sites s
LEFT JOIN site_content_type_settings scts ON scts.site_id = s.id AND scts.is_enabled = true
LEFT JOIN editorial_content_types ect ON ect.id = scts.content_type_id
GROUP BY s.id, s.name, s.site_type
ORDER BY s.created_at DESC;
