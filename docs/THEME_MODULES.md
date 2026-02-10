# Configuration des Modules de Thème

## Vue d'ensemble

Le système de modules de thème permet de configurer l'apparence et la disposition des différentes pages de votre site (homepage, posts, catégories) via une configuration JSON stockée en base de données.

## Architecture

### Structure de la configuration

La configuration des modules est stockée dans la colonne `modules_config` de la table `themes` (type JSONB).

Chaque page peut avoir sa propre configuration :
- `homepage` : Configuration de la page d'accueil
- `post` : Configuration des pages d'articles
- `category` : Configuration des pages de catégories
- `tag` : Configuration des pages de tags

### Structure d'une configuration de page

```json
{
  "layout": "default" | "centered" | "with_sidebar" | "full_width",
  "modules": [
    {
      "type": "nom_du_module",
      "enabled": true,
      "config": {
        // Configuration spécifique au module
      }
    }
  ],
  "sidebar": {
    "enabled": false,
    "position": "right" | "left",
    "modules": [...]
  }
}
```

## Modules disponibles

### 1. Hero Module

Module d'en-tête pour afficher le titre et le tagline du site.

**Type:** `hero`

**Configuration:**
```json
{
  "type": "hero",
  "enabled": true,
  "config": {
    "showTitle": true,
    "showTagline": true,
    "centered": true
  }
}
```

**Options:**
- `showTitle` (boolean) : Afficher le titre du site
- `showTagline` (boolean) : Afficher le tagline
- `centered` (boolean) : Centrer le contenu

---

### 2. Posts Grid Module

Affiche les articles en grille (2 ou 3 colonnes).

**Type:** `posts_grid`

**Configuration:**
```json
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
```

**Options:**
- `columns` (number) : Nombre de colonnes (1, 2 ou 3)
- `showExcerpt` (boolean) : Afficher l'extrait
- `showDate` (boolean) : Afficher la date de publication
- `showCategories` (boolean) : Afficher les catégories
- `showImage` (boolean) : Afficher l'image mise en avant
- `limit` (number) : Nombre maximum d'articles à afficher

---

### 3. Posts List Module

Affiche les articles en liste verticale.

**Type:** `posts_list`

**Configuration:**
```json
{
  "type": "posts_list",
  "enabled": true,
  "config": {
    "showExcerpt": true,
    "showDate": true,
    "style": "default"
  }
}
```

**Options:**
- `showExcerpt` (boolean) : Afficher l'extrait
- `showDate` (boolean) : Afficher la date
- `showImage` (boolean) : Afficher l'image
- `style` (string) : Style d'affichage ("default", "minimal", "compact")

---

### 4. Recent Posts Module (Sidebar)

Module pour la sidebar affichant les articles récents.

**Type:** `recent_posts`

**Configuration:**
```json
{
  "type": "recent_posts",
  "enabled": true,
  "config": {
    "limit": 5,
    "showDate": true
  }
}
```

**Options:**
- `limit` (number) : Nombre d'articles à afficher
- `showThumbnail` (boolean) : Afficher la miniature
- `showDate` (boolean) : Afficher la date

---

### 5. Categories Module (Sidebar)

Module pour la sidebar affichant les catégories.

**Type:** `categories`

**Configuration:**
```json
{
  "type": "categories",
  "enabled": true,
  "config": {
    "showCount": true,
    "limit": 10
  }
}
```

**Options:**
- `showCount` (boolean) : Afficher le nombre d'articles par catégorie
- `limit` (number) : Nombre maximum de catégories

---

## Exemples de configurations

### Homepage minimaliste (sans sidebar)

```json
{
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
}
```

### Homepage type magazine (avec sidebar)

```json
{
  "homepage": {
    "layout": "with_sidebar",
    "modules": [
      {
        "type": "hero",
        "enabled": true,
        "config": {
          "showTitle": true,
          "showTagline": false,
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
}
```

### Homepage en grille 3 colonnes (pleine largeur)

```json
{
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
}
```

## Types de layouts disponibles

- **`default`** : Layout standard (max-width: 1280px)
- **`centered`** : Layout centré étroit (max-width: 896px)
- **`with_sidebar`** : Layout avec sidebar (grid 8/4 colonnes)
- **`full_width`** : Pleine largeur

## Comment appliquer une configuration

### Via SQL

```sql
UPDATE themes 
SET modules_config = '{
  "homepage": {
    "layout": "with_sidebar",
    "modules": [...],
    "sidebar": {...}
  }
}'::jsonb
WHERE key = 'mon-theme';
```

### Via l'admin (à venir)

Une interface d'administration permettra de configurer visuellement les modules sans toucher au SQL.

## Créer un nouveau module

Pour ajouter un nouveau type de module :

1. Créer le composant dans `app/(public)/themes/modules/`
2. Ajouter le type dans `lib/db/theme-types.ts`
3. Ajouter le case dans `ModuleRenderer.tsx`
4. Documenter dans ce fichier

### Exemple de structure d'un module

```tsx
import type { MonModuleConfig } from '@/lib/db/theme-types';

interface Props {
  config: MonModuleConfig;
  data: any;
}

export default function MonModule({ config, data }: Props) {
  // Logique du module
  return (
    <div>
      {/* Contenu du module */}
    </div>
  );
}
```

## Notes importantes

- Tous les modules respectent les couleurs et polices du thème (via CSS variables)
- Les modules sont responsives par défaut (Tailwind CSS)
- La configuration est validée côté serveur
- Les modules désactivés (`enabled: false`) ne sont pas rendus
