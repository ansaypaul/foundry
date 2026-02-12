-- Migration: Link articles to AI jobs
-- Description: Add ai_job_id to content table to track AI-generated articles

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS ai_job_id UUID REFERENCES ai_job(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_content_ai_job_id ON content(ai_job_id);

COMMENT ON COLUMN content.ai_job_id IS 'Reference to AI job that generated this article (if AI-generated)';
