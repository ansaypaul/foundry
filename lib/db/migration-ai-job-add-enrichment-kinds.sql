-- Migration: Add enrichment kinds to ai_job
-- Description: Expands kind constraint to support category and author enrichment

-- Drop existing constraint
ALTER TABLE ai_job
  DROP CONSTRAINT IF EXISTS ai_job_kind_check;

-- Add new constraint with enrichment kinds
ALTER TABLE ai_job
  ADD CONSTRAINT ai_job_kind_check 
  CHECK (kind IN (
    'article_generate', 
    'content_rewrite', 
    'seo_optimize', 
    'enrich_categories', 
    'enrich_authors',
    'enrich_pages',
    'generate_blueprint_template'
  ));

COMMENT ON COLUMN ai_job.kind IS 'Type of AI job: article_generate, content_rewrite, seo_optimize, enrich_categories, enrich_authors, enrich_pages, generate_blueprint_template';
