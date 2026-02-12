-- Add page_type field for Mandatory Pages Generator v1
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS page_type VARCHAR(50);

-- Add index for page type queries
CREATE INDEX IF NOT EXISTS idx_content_page_type ON content(site_id, page_type) WHERE page_type IS NOT NULL;

-- Comments
COMMENT ON COLUMN content.page_type IS 'Page type for mandatory/special pages (about, contact, legal, privacy, cgu, editorial_charter)';
