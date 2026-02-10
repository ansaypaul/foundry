-- Seed : Thèmes prédéfinis avec configuration de modules

-- Thème "Default" - Configuration simple et propre
INSERT INTO themes (key, name, description, layout_type, colors, fonts, modules_config, is_active)
VALUES (
  'default',
  'Thème par défaut',
  'Thème simple et épuré avec grille d''articles',
  'default',
  '{
    "primary": "#3B82F6",
    "secondary": "#1F2937",
    "background": "#FFFFFF",
    "text": "#111827",
    "accent": "#10B981",
    "border": "#E5E7EB"
  }'::jsonb,
  '{
    "heading": "Inter",
    "body": "Inter"
  }'::jsonb,
  '{
    "homepage": {
      "layout": "default",
      "modules": [
        {
          "type": "hero",
          "enabled": true,
          "config": {
            "showTitle": true,
            "showTagline": true,
            "centered": true
          }
        },
        {
          "type": "posts_grid",
          "enabled": true,
          "config": {
            "columns": 2,
            "showExcerpt": true,
            "showDate": true,
            "limit": 6
          }
        }
      ],
      "sidebar": {
        "enabled": false
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  modules_config = EXCLUDED.modules_config;

-- Thème "Magazine" - Layout avec sidebar
INSERT INTO themes (key, name, description, layout_type, colors, fonts, modules_config, is_active)
VALUES (
  'magazine',
  'Magazine',
  'Layout type magazine avec sidebar et grille d''articles',
  'magazine',
  '{
    "primary": "#DC2626",
    "secondary": "#1F2937",
    "background": "#FFFFFF",
    "text": "#111827",
    "accent": "#F59E0B",
    "border": "#E5E7EB"
  }'::jsonb,
  '{
    "heading": "Merriweather",
    "body": "Inter"
  }'::jsonb,
  '{
    "homepage": {
      "layout": "with_sidebar",
      "modules": [
        {
          "type": "hero",
          "enabled": true,
          "config": {
            "showTitle": true,
            "showTagline": true,
            "centered": false
          }
        },
        {
          "type": "posts_grid",
          "enabled": true,
          "config": {
            "columns": 2,
            "showExcerpt": true,
            "showDate": true,
            "showCategories": true,
            "limit": 8
          }
        }
      ],
      "sidebar": {
        "enabled": true,
        "position": "right",
        "modules": [
          {
            "type": "recent_posts",
            "enabled": true,
            "config": {
              "limit": 5,
              "showDate": true
            }
          },
          {
            "type": "categories",
            "enabled": true,
            "config": {
              "showCount": true,
              "limit": 10
            }
          }
        ]
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  modules_config = EXCLUDED.modules_config;

-- Thème "Minimal" - Design épuré sans fioritures
INSERT INTO themes (key, name, description, layout_type, colors, fonts, modules_config, is_active)
VALUES (
  'minimal',
  'Minimal',
  'Design minimaliste avec liste simple',
  'minimal',
  '{
    "primary": "#000000",
    "secondary": "#6B7280",
    "background": "#FFFFFF",
    "text": "#1F2937",
    "accent": "#3B82F6",
    "border": "#E5E7EB"
  }'::jsonb,
  '{
    "heading": "Georgia",
    "body": "Georgia"
  }'::jsonb,
  '{
    "homepage": {
      "layout": "centered",
      "modules": [
        {
          "type": "hero",
          "enabled": true,
          "config": {
            "showTitle": true,
            "showTagline": true,
            "centered": true
          }
        },
        {
          "type": "posts_list",
          "enabled": true,
          "config": {
            "showExcerpt": true,
            "showDate": true,
            "style": "minimal"
          }
        }
      ],
      "sidebar": {
        "enabled": false
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  modules_config = EXCLUDED.modules_config;

-- Thème "Grid" - Grille 3 colonnes pleine largeur
INSERT INTO themes (key, name, description, layout_type, colors, fonts, modules_config, is_active)
VALUES (
  'grid',
  'Grille',
  'Layout en grille 3 colonnes sur toute la largeur',
  'default',
  '{
    "primary": "#8B5CF6",
    "secondary": "#1F2937",
    "background": "#F9FAFB",
    "text": "#111827",
    "accent": "#EC4899",
    "border": "#E5E7EB"
  }'::jsonb,
  '{
    "heading": "Inter",
    "body": "Inter"
  }'::jsonb,
  '{
    "homepage": {
      "layout": "full_width",
      "modules": [
        {
          "type": "posts_grid",
          "enabled": true,
          "config": {
            "columns": 3,
            "showExcerpt": false,
            "showDate": true,
            "limit": 12
          }
        }
      ],
      "sidebar": {
        "enabled": false
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  modules_config = EXCLUDED.modules_config;

-- Afficher les thèmes créés
SELECT key, name, description FROM themes WHERE is_active = true ORDER BY name;
