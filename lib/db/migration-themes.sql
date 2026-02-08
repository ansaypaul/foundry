-- Table des thèmes disponibles
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'minimal', 'magazine', 'dark', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Structure du layout
  layout_type TEXT NOT NULL DEFAULT 'default', -- 'default', 'minimal', 'magazine', 'blog'
  
  -- Personnalisation visuelle (JSONB pour flexibilité)
  colors JSONB DEFAULT '{
    "primary": "#3B82F6",
    "secondary": "#1F2937",
    "background": "#FFFFFF",
    "text": "#111827",
    "accent": "#10B981"
  }'::jsonb,
  
  fonts JSONB DEFAULT '{
    "heading": "Inter",
    "body": "Inter"
  }'::jsonb,
  
  -- Options supplémentaires
  options JSONB DEFAULT '{}'::jsonb,
  
  -- Preview
  preview_image TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour updated_at
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON themes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Thèmes de base
INSERT INTO themes (key, name, description, layout_type, colors) VALUES
('default', 'Défaut', 'Thème par défaut, propre et moderne', 'default', '{
  "primary": "#3B82F6",
  "secondary": "#1F2937",
  "background": "#FFFFFF",
  "text": "#111827",
  "accent": "#10B981",
  "border": "#E5E7EB"
}'::jsonb),

('minimal', 'Minimaliste', 'Design épuré et minimaliste', 'minimal', '{
  "primary": "#000000",
  "secondary": "#6B7280",
  "background": "#FFFFFF",
  "text": "#111827",
  "accent": "#000000",
  "border": "#F3F4F6"
}'::jsonb),

('dark', 'Dark Mode', 'Thème sombre pour les yeux', 'default', '{
  "primary": "#60A5FA",
  "secondary": "#374151",
  "background": "#111827",
  "text": "#F9FAFB",
  "accent": "#34D399",
  "border": "#374151"
}'::jsonb),

('magazine', 'Magazine', 'Style magazine avec grille', 'magazine', '{
  "primary": "#DC2626",
  "secondary": "#991B1B",
  "background": "#FAFAFA",
  "text": "#1F2937",
  "accent": "#DC2626",
  "border": "#E5E7EB"
}'::jsonb);

-- Modifier la table sites pour référencer le thème
ALTER TABLE sites 
  DROP COLUMN IF EXISTS theme_key,
  ADD COLUMN theme_id UUID REFERENCES themes(id) ON DELETE SET NULL;

-- Assigner le thème par défaut aux sites existants
UPDATE sites 
SET theme_id = (SELECT id FROM themes WHERE key = 'default' LIMIT 1)
WHERE theme_id IS NULL;

COMMENT ON TABLE themes IS 'Thèmes visuels disponibles pour les sites';
COMMENT ON COLUMN themes.layout_type IS 'Type de structure du thème (default, minimal, magazine, blog)';
COMMENT ON COLUMN themes.colors IS 'Palette de couleurs du thème (JSON)';
COMMENT ON COLUMN themes.fonts IS 'Configuration des polices (JSON)';
