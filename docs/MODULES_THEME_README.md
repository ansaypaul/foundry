# Système de Modules de Thème - Récapitulatif

## 🎯 Ce qui a été créé

J'ai mis en place un système complet de modules configurables pour les thèmes de Foundry. Ce système vous permet de configurer l'apparence et la disposition de vos pages (notamment la homepage) via une configuration JSON stockée en base de données, sans toucher au code.

## 📁 Fichiers créés

### Migrations SQL
- `lib/db/migration-theme-modules.sql` - Ajoute la colonne `modules_config` à la table `themes`
- `lib/db/migration-theme-modules-seed.sql` - Insère 4 thèmes prédéfinis (Default, Magazine, Minimal, Grid)

### Types TypeScript
- `lib/db/theme-types.ts` - Tous les types pour les thèmes et modules

### Composants de modules
- `app/(public)/themes/modules/HeroModule.tsx` - En-tête avec titre et tagline
- `app/(public)/themes/modules/PostsGridModule.tsx` - Grille d'articles (1-3 colonnes)
- `app/(public)/themes/modules/PostsListModule.tsx` - Liste d'articles
- `app/(public)/themes/modules/RecentPostsModule.tsx` - Module sidebar : articles récents
- `app/(public)/themes/modules/CategoriesModule.tsx` - Module sidebar : catégories
- `app/(public)/themes/modules/ModuleRenderer.tsx` - Orchestrateur de modules
- `app/(public)/themes/modules/index.ts` - Export de tous les modules

### Layout
- `app/(public)/themes/layouts/PageLayout.tsx` - Layout avec support sidebar (gauche/droite)

### Queries
- `lib/db/queries.ts` - Ajout de `getCategoriesWithCount()`

### Documentation
- `docs/THEME_MODULES.md` - Documentation complète
- `docs/THEME_MODULES_QUICKSTART.md` - Guide de démarrage rapide
- `docs/MODULES_THEME_README.md` - Ce fichier

### Modifications
- `app/(public)/page.tsx` - Homepage mise à jour pour utiliser le système de modules

## 🚀 Comment ça marche

### 1. Configuration simple en JSON

Chaque thème peut définir sa configuration de modules dans `modules_config` (JSONB) :

```json
{
  "homepage": {
    "layout": "with_sidebar",
    "modules": [
      {"type": "hero", "enabled": true, "config": {...}},
      {"type": "posts_grid", "enabled": true, "config": {...}}
    ],
    "sidebar": {
      "enabled": true,
      "position": "right",
      "modules": [...]
    }
  }
}
```

### 2. Layouts disponibles

- **`default`** : Standard (max-width: 1280px)
- **`centered`** : Centré étroit (max-width: 896px)
- **`with_sidebar`** : Avec sidebar (8/4 colonnes)
- **`full_width`** : Pleine largeur

### 3. Modules disponibles

**Contenu principal :**
- `hero` - En-tête avec titre/tagline
- `posts_grid` - Grille d'articles (1-3 colonnes)
- `posts_list` - Liste d'articles (styles: default, minimal, compact)

**Sidebar :**
- `recent_posts` - Articles récents
- `categories` - Liste des catégories avec compteur

## 📝 Exemples d'utilisation

### Exemple 1 : Homepage simple sans sidebar

```sql
UPDATE themes 
SET modules_config = '{
  "homepage": {
    "layout": "centered",
    "modules": [
      {
        "type": "hero",
        "enabled": true,
        "config": {"showTitle": true, "showTagline": true, "centered": true}
      },
      {
        "type": "posts_list",
        "enabled": true,
        "config": {"showExcerpt": true, "showDate": true, "style": "minimal"}
      }
    ],
    "sidebar": {"enabled": false}
  }
}'::jsonb
WHERE key = 'mon-theme';
```

### Exemple 2 : Homepage type magazine avec sidebar

```sql
UPDATE themes 
SET modules_config = '{
  "homepage": {
    "layout": "with_sidebar",
    "modules": [
      {
        "type": "posts_grid",
        "enabled": true,
        "config": {"columns": 2, "showExcerpt": true, "showDate": true}
      }
    ],
    "sidebar": {
      "enabled": true,
      "position": "right",
      "modules": [
        {"type": "recent_posts", "enabled": true, "config": {"limit": 5}},
        {"type": "categories", "enabled": true, "config": {"showCount": true}}
      ]
    }
  }
}'::jsonb
WHERE key = 'mon-theme';
```

### Exemple 3 : Grille 3 colonnes pleine largeur

```sql
UPDATE themes 
SET modules_config = '{
  "homepage": {
    "layout": "full_width",
    "modules": [
      {
        "type": "posts_grid",
        "enabled": true,
        "config": {"columns": 3, "showExcerpt": false, "showDate": true, "limit": 12}
      }
    ],
    "sidebar": {"enabled": false}
  }
}'::jsonb
WHERE key = 'mon-theme';
```

## 🎨 Personnalisation

### Changer le nombre de colonnes
```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage,modules,0,config,columns}',
  '3'::jsonb
)
WHERE key = 'mon-theme';
```

### Activer/désactiver la sidebar
```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage,sidebar,enabled}',
  'true'::jsonb
)
WHERE key = 'mon-theme';
```

### Changer la position de la sidebar
```sql
UPDATE themes 
SET modules_config = jsonb_set(
  modules_config,
  '{homepage,sidebar,position}',
  '"left"'::jsonb
)
WHERE key = 'mon-theme';
```

## 🔧 Installation

### Étape 1 : Appliquer les migrations

```bash
# Via psql
psql -d votre_database -f lib/db/migration-theme-modules.sql

# Optionnel : Insérer les thèmes prédéfinis
psql -d votre_database -f lib/db/migration-theme-modules-seed.sql
```

Ou via Supabase SQL Editor :
1. Copiez le contenu de `migration-theme-modules.sql`
2. Exécutez dans SQL Editor
3. Faites de même avec `migration-theme-modules-seed.sql` (optionnel)

### Étape 2 : Assigner un thème à votre site

```sql
-- Voir les thèmes disponibles
SELECT id, key, name FROM themes WHERE is_active = true;

-- Assigner à votre site
UPDATE sites 
SET theme_id = 'ID_DU_THEME'
WHERE id = 'ID_DE_VOTRE_SITE';
```

### Étape 3 : Redémarrer le dev server

```bash
npm run dev
```

## 🎯 Avantages

✅ **Configuration flexible** : Changez le design sans toucher au code  
✅ **Réutilisable** : Modules réutilisables sur différentes pages  
✅ **Responsive** : Tout est responsive par défaut (Tailwind)  
✅ **Thème aware** : Tous les modules respectent les couleurs/polices du thème  
✅ **Extensible** : Facile d'ajouter de nouveaux modules  
✅ **Type-safe** : TypeScript pour tout  

## 🔜 Évolutions futures

- Interface d'administration pour configurer les modules visuellement
- Plus de modules (featured post, newsletter, search, etc.)
- Configuration par page individuelle (override au niveau post/page)
- Templates de layouts prédéfinis
- Preview en temps réel dans l'admin

## 📚 Documentation complète

Consultez `THEME_MODULES.md` pour la documentation complète de chaque module avec toutes les options disponibles.
