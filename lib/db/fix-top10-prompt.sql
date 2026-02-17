-- ====================================
-- FIX: SIMPLIFIER le système de gating
-- Mode SIMPLE : juste vérifier que Perplexity a répondu
-- ====================================

UPDATE editorial_content_types
SET 
  -- Mode ULTRA SIMPLE : juste la longueur minimale
  research_gating_rules = '{
    "min_content_length": 200
  }'::jsonb,
  
  -- Prompt SIMPLE : juste demander les infos
  research_prompt_template = 'Provide comprehensive research for a Top 10 article about: {{topic}}{{angle}}

Please include:
- 10 items with names, key facts, dates, and why they are notable
- Any pricing or technical specifications available
- Sources for your information

Write in clear, detailed markdown format.'

WHERE key = 'top10';

-- AUSSI: Simplifier TOUS les autres types
UPDATE editorial_content_types
SET research_gating_rules = '{"min_content_length": 200}'::jsonb
WHERE research_required = true;

-- Réduire le nombre de tentatives (économiser les crédits)
UPDATE editorial_content_types
SET research_max_attempts = 2
WHERE research_required = true;

-- Vérification
SELECT 
  key,
  label,
  research_required,
  research_max_attempts,
  research_gating_rules,
  LENGTH(research_prompt_template) as prompt_length
FROM editorial_content_types
WHERE research_required = true
ORDER BY key;
