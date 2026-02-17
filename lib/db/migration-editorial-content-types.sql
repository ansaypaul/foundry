-- ====================================
-- EDITORIAL CONTENT TYPES REGISTRY
-- Central registry for article content types with templates & prompts
-- ====================================

-- 1. Create editorial_content_types table (global registry)
CREATE TABLE IF NOT EXISTS editorial_content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Template (structural definition)
  template_schema JSONB NOT NULL,
  
  -- Prompts (AI instructions)
  system_prompt TEXT NULL,
  style_prompt TEXT NULL,
  plan_prompt TEXT NULL,
  format_prompt TEXT NULL,
  notes TEXT NULL,
  
  -- Validation profile (machine-readable rules)
  validator_profile JSONB NOT NULL,
  
  -- HTML / Format
  allowed_html_tags JSONB NOT NULL DEFAULT '["h2", "p", "b", "i", "strong", "em", "ul", "li", "a"]'::jsonb,
  forbidden_patterns JSONB NOT NULL DEFAULT '["—", "En conclusion", "Pour conclure"]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_editorial_content_types_key ON editorial_content_types(key);
CREATE INDEX IF NOT EXISTS idx_editorial_content_types_active ON editorial_content_types(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE editorial_content_types IS 'Global registry of editorial content types with templates, prompts, and validation rules';
COMMENT ON COLUMN editorial_content_types.key IS 'Immutable key (e.g., "news", "guide", "top10") - used in code';
COMMENT ON COLUMN editorial_content_types.is_system IS 'True for core types shipped with Foundry (cannot be deleted)';
COMMENT ON COLUMN editorial_content_types.template_schema IS 'JSONB structural template (blocks, rules, expected structure)';
COMMENT ON COLUMN editorial_content_types.system_prompt IS 'AI system prompt specific to this content type';
COMMENT ON COLUMN editorial_content_types.style_prompt IS 'AI style/tone instructions';
COMMENT ON COLUMN editorial_content_types.plan_prompt IS 'AI plan/structure instructions';
COMMENT ON COLUMN editorial_content_types.format_prompt IS 'AI format/HTML instructions';
COMMENT ON COLUMN editorial_content_types.validator_profile IS 'JSONB validation rules (min_words, h2_count, etc.)';
COMMENT ON COLUMN editorial_content_types.allowed_html_tags IS 'Array of allowed HTML tags for this type';
COMMENT ON COLUMN editorial_content_types.forbidden_patterns IS 'Array of forbidden strings/patterns';

-- ====================================
-- 2. Create site_content_type_settings (pivot table with overrides)
-- ====================================

CREATE TABLE IF NOT EXISTS site_content_type_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  content_type_id UUID NOT NULL REFERENCES editorial_content_types(id) ON DELETE CASCADE,
  
  -- Activation
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Per-site overrides (NULL = use global values)
  template_schema_override JSONB NULL,
  system_prompt_override TEXT NULL,
  style_prompt_override TEXT NULL,
  plan_prompt_override TEXT NULL,
  format_prompt_override TEXT NULL,
  validator_profile_override JSONB NULL,
  allowed_html_tags_override JSONB NULL,
  forbidden_patterns_override JSONB NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_site_content_type UNIQUE(site_id, content_type_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_content_type_site ON site_content_type_settings(site_id);
CREATE INDEX IF NOT EXISTS idx_site_content_type_enabled ON site_content_type_settings(site_id, is_enabled) WHERE is_enabled = true;

-- Comments
COMMENT ON TABLE site_content_type_settings IS 'Per-site content type activation and overrides';
COMMENT ON COLUMN site_content_type_settings.is_enabled IS 'Whether this content type is available for this site';
COMMENT ON COLUMN site_content_type_settings.template_schema_override IS 'Override global template_schema for this site (NULL = use global)';
COMMENT ON COLUMN site_content_type_settings.system_prompt_override IS 'Override global system_prompt for this site (NULL = use global)';

-- ====================================
-- 3. Add content_type_id to content table
-- ====================================

-- Add new column (nullable for migration)
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS content_type_id UUID NULL REFERENCES editorial_content_types(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_content_content_type_id ON content(content_type_id);

-- Comment
COMMENT ON COLUMN content.content_type_id IS 'Reference to editorial content type (replaces content_type_key)';

-- ====================================
-- 4. Deprecate old content_types table
-- ====================================

-- Add comment to mark as deprecated
COMMENT ON TABLE content_types IS 'DEPRECATED: Use editorial_content_types instead. Will be removed in future version.';
COMMENT ON COLUMN content.content_type_key IS 'DEPRECATED: Use content_type_id instead. Kept for backward compatibility.';
