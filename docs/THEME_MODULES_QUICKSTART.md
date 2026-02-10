# Configuration des modules de thème - Démarrage rapide

## Étape 1 : Appliquer la migration

Exécutez la migration pour ajouter le support des modules :

```bash
# Connectez-vous à votre base de données et exécutez
psql -d votre_database -f lib/db/migration-theme-modules.sql
```

Ou via Supabase SQL Editor :
1. Ouvrez votre projet Supabase
2. Allez dans SQL Editor
3. Copiez le contenu de `lib/db/migration-theme-modules.sql`
4. Exécutez

## Étape 2 : Créer un thème simple

```sql
INSERT INTO themes (key, name, description, layout_type, modules_config) 
VALUES (
  'simple',
  'Thème Simple',
  'Un thème simple avec liste d''articles',
  'default',
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
            "style": "default"
          }
        }
      ],
      "sidebar": {
        "enabled": false
      }
    }
  }'::jsonb
);
```

## Étape 3 : Assigner le thème à un site

```sql
-- Récupérer l'ID du thème
SELECT id, key, name FROM themes WHERE key = 'simple';

-- Assigner le thème à votre site
UPDATE sites 
SET theme_id = 'ID_DU_THEME_ICI'
WHERE id = 'ID_DE_VOTRE_SITE';
```

## Étape 4 : Tester

Visitez votre site, la homepage devrait maintenant utiliser la configuration du thème !

## Exemples de configurations rapides

### Homepage avec sidebar à droite

```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage}',
  '{
    "layout": "with_sidebar",
    "modules": [
      {
        "type": "posts_grid",
        "enabled": true,
        "config": {
          "columns": 2,
          "showExcerpt": true,
          "showDate": true
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
          "config": {"limit": 5}
        },
        {
          "type": "categories",
          "enabled": true,
          "config": {"showCount": true}
        }
      ]
    }
  }'::jsonb
)
WHERE key = 'simple';
```

### Désactiver la sidebar

```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage,sidebar,enabled}',
  'false'::jsonb
)
WHERE key = 'simple';
```

### Changer le nombre de colonnes

```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage,modules,1,config,columns}',
  '3'::jsonb
)
WHERE key = 'simple';
```

## Modules disponibles

### Pour le contenu principal
- `hero` : En-tête avec titre et tagline
- `posts_grid` : Grille d'articles (1-3 colonnes)
- `posts_list` : Liste d'articles

### Pour la sidebar
- `recent_posts` : Articles récents
- `categories` : Liste des catégories

## Prochaines étapes

Consultez la documentation complète dans `THEME_MODULES.md` pour :
- Toutes les options de configuration
- Créer vos propres modules personnalisés
- Exemples avancés
