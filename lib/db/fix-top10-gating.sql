-- ====================================
-- FIX: Assouplir les règles de gating pour top10
-- Pour faciliter les tests initiaux
-- ====================================

UPDATE editorial_content_types
SET research_gating_rules = '{
  "min_sources": 3,
  "require_official_source": false,
  "min_items": 8,
  "min_content_length": 800
}'::jsonb
WHERE key = 'top10';

-- Vérification
SELECT 
  key,
  label,
  research_gating_rules
FROM editorial_content_types
WHERE key = 'top10';
