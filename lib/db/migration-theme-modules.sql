-- Migration : Ajout de la configuration de modules pour les thèmes
-- Cette migration ajoute la capacité de configurer des modules/blocs pour les différentes pages

-- Ajout de la colonne modules_config pour configurer les modules par page
ALTER TABLE themes 
ADD COLUMN IF NOT EXISTS modules_config JSONB DEFAULT '{
  "homepage": {
    "layout": "default",
    "modules": [
      {
        "type": "hero",
        "enabled": true,
        "config": {
          "showTitle": true,
          "showTagline": true
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
      "enabled": false,
      "position": "right",
      "modules": []
    }
  },
  "post": {
    "layout": "default",
    "sidebar": {
      "enabled": true,
      "position": "right",
      "modules": ["recent_posts", "categories"]
    }
  },
  "category": {
    "layout": "default",
    "sidebar": {
      "enabled": false
    }
  }
}'::jsonb;

-- Exemples de configurations de thèmes

-- Thème minimal (sans sidebar)
UPDATE themes 
SET modules_config = '{
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
}'::jsonb
WHERE key = 'minimal';

-- Thème magazine (avec sidebar)
UPDATE themes 
SET modules_config = '{
  "homepage": {
    "layout": "with_sidebar",
    "modules": [
      {
        "type": "featured_post",
        "enabled": true,
        "config": {
          "showImage": true,
          "size": "large"
        }
      },
      {
        "type": "posts_grid",
        "enabled": true,
        "config": {
          "columns": 2,
          "showExcerpt": true,
          "showDate": true,
          "showCategories": true
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
            "showThumbnail": true
          }
        },
        {
          "type": "categories",
          "enabled": true,
          "config": {
            "showCount": true
          }
        }
      ]
    }
  }
}'::jsonb
WHERE key = 'magazine';

COMMENT ON COLUMN themes.modules_config IS 'Configuration JSONB des modules et layouts par type de page (homepage, post, category, etc.)';
