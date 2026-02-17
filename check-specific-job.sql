-- Vérification du job AI: aefb3b3e-bdab-4e35-b3ad-74a0e7d501db

-- 1. Infos générales
SELECT 
  id,
  status,
  error_code,
  error_message,
  retries,
  created_at,
  finished_at,
  -- Vérifier si output_json contient des attempts
  output_json ? 'attempts' as has_attempts_key,
  -- Compter le nombre d'attempts
  CASE 
    WHEN output_json ? 'attempts' THEN jsonb_array_length(output_json->'attempts')
    ELSE 0
  END as attempts_count,
  -- Vérifier la taille du output_json
  length(output_json::text) as output_json_size
FROM ai_job
WHERE id = 'aefb3b3e-bdab-4e35-b3ad-74a0e7d501db';

-- 2. Voir le output_json complet (lisible)
SELECT jsonb_pretty(output_json) as output_json_formatted
FROM ai_job
WHERE id = 'aefb3b3e-bdab-4e35-b3ad-74a0e7d501db';

-- 3. Si attempts existe, extraire les détails de chaque attempt
SELECT 
  attempt->>'attemptNumber' as attempt_number,
  (attempt->'validation'->>'valid')::boolean as is_valid,
  attempt->>'htmlLength' as html_length_declared,
  length(attempt->>'htmlGenerated') as html_actually_stored,
  attempt->>'title' as attempt_title,
  jsonb_array_length(attempt->'validation'->'errors') as errors_count,
  left(attempt->>'htmlGenerated', 200) as html_preview
FROM ai_job,
  jsonb_array_elements(output_json->'attempts') as attempt
WHERE id = 'aefb3b3e-bdab-4e35-b3ad-74a0e7d501db'
ORDER BY (attempt->>'attemptNumber')::int;

-- 4. Voir le HTML COMPLET du premier attempt (si existe)
SELECT 
  attempt->>'attemptNumber' as attempt_number,
  attempt->>'htmlGenerated' as full_html
FROM ai_job,
  jsonb_array_elements(output_json->'attempts') as attempt
WHERE id = 'aefb3b3e-bdab-4e35-b3ad-74a0e7d501db'
  AND attempt->>'attemptNumber' = '1';
