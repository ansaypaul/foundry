-- Requête pour vérifier le contenu des attempts dans un job AI
-- Remplacez 'YOUR_JOB_ID' par l'ID de votre job

-- 1. Voir les infos générales du job
SELECT 
  id,
  status,
  error_code,
  retries,
  created_at,
  finished_at,
  -- Vérifier si output_json contient des attempts
  output_json ? 'attempts' as has_attempts,
  -- Compter le nombre d'attempts
  jsonb_array_length(output_json->'attempts') as attempts_count
FROM ai_job
WHERE id = 'YOUR_JOB_ID';

-- 2. Voir le output_json complet (format lisible)
SELECT 
  id,
  jsonb_pretty(output_json) as output_json_formatted
FROM ai_job
WHERE id = 'YOUR_JOB_ID';

-- 3. Extraire chaque attempt avec son HTML
SELECT 
  id,
  attempt->>'attemptNumber' as attempt_number,
  (attempt->'validation'->>'valid')::boolean as is_valid,
  attempt->>'htmlLength' as html_length,
  length(attempt->>'htmlGenerated') as html_stored_length,
  left(attempt->>'htmlGenerated', 100) as html_preview
FROM ai_job,
  jsonb_array_elements(output_json->'attempts') as attempt
WHERE id = 'YOUR_JOB_ID'
ORDER BY (attempt->>'attemptNumber')::int;

-- 4. Voir le HTML COMPLET d'un attempt spécifique (ex: attempt 1)
SELECT 
  attempt->>'htmlGenerated' as full_html
FROM ai_job,
  jsonb_array_elements(output_json->'attempts') as attempt
WHERE id = 'YOUR_JOB_ID'
  AND attempt->>'attemptNumber' = '1';
