-- Add content_type_key to content table for Article Factory v1
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS content_type_key VARCHAR(100);

-- Add foreign key constraint (with validation disabled for existing rows)
-- First, set a default value for existing posts
UPDATE content 
SET content_type_key = 'news' 
WHERE type = 'post' AND content_type_key IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_content_content_type_key ON content(site_id, content_type_key);

-- Comments
COMMENT ON COLUMN content.content_type_key IS 'Content type key from content_types table (news, review_test, etc.)';
