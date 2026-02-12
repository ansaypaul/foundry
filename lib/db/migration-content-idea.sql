-- Migration: Add content_idea table for AI article generation
-- Description: Stores article ideas before they are generated

CREATE TABLE IF NOT EXISTS content_idea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'rss')),
  title VARCHAR(500) NOT NULL,
  angle TEXT,
  content_type_key VARCHAR(100) NOT NULL,
  category_slug VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'done', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_idea_site_id ON content_idea(site_id);
CREATE INDEX IF NOT EXISTS idx_content_idea_status ON content_idea(site_id, status);
CREATE INDEX IF NOT EXISTS idx_content_idea_created ON content_idea(created_at DESC);

-- Comments
COMMENT ON TABLE content_idea IS 'Article ideas before generation (manual, AI, or RSS source)';
COMMENT ON COLUMN content_idea.source IS 'Origin of the idea: manual (user input), ai (AI suggested), rss (from feed)';
COMMENT ON COLUMN content_idea.angle IS 'Optional angle or perspective for the article';
COMMENT ON COLUMN content_idea.status IS 'Processing status: new, processing, done, error';
COMMENT ON COLUMN content_idea.metadata IS 'Additional metadata (source_url, etc.)';
