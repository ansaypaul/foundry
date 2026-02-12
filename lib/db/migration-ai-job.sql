-- Migration: Update ai_job table with new fields for logging
-- Description: Adds error_code, started_at, finished_at and expands kind constraint

-- Add new columns if they don't exist
ALTER TABLE ai_job
  ADD COLUMN IF NOT EXISTS error_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- Drop and recreate kind constraint with new values
ALTER TABLE ai_job
  DROP CONSTRAINT IF EXISTS ai_job_kind_check;

ALTER TABLE ai_job
  ADD CONSTRAINT ai_job_kind_check 
  CHECK (kind IN ('article_generate', 'content_rewrite', 'seo_optimize', 'enrich_categories', 'enrich_authors'));

-- Indexes (already exist, but we ensure they're there)
CREATE INDEX IF NOT EXISTS idx_ai_job_site_id ON ai_job(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_status ON ai_job(site_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_job_created ON ai_job(created_at DESC);

-- Comments for new fields
COMMENT ON COLUMN ai_job.error_code IS 'Error code for failed jobs (VALIDATION_FAILED, OPENAI_ERROR, etc.)';
COMMENT ON COLUMN ai_job.started_at IS 'When the job started processing';
COMMENT ON COLUMN ai_job.finished_at IS 'When the job completed or failed';
