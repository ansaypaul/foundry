# Migration SEO Core - Instructions

## Vue d'ensemble

Cette migration ajoute toutes les fonctionnalités SEO au core de Foundry, inspirées de Rank Math.

### Modifications apportées :

1. **Table `content`** : Ajout de 18 colonnes SEO
2. **Table `terms`** : Ajout de 11 colonnes SEO
3. **Nouvelle table `seo_redirects`** : Gestion des redirections 301/302
4. **Nouvelle table `seo_settings`** : Configuration SEO globale par site

---

## Application de la migration

### Option 1 : Via Supabase Dashboard (recommandé)

1. Ouvrir le Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier le contenu de `migration-seo-core.sql`
4. Exécuter la requête

### Option 2 : Via CLI Supabase

```bash
supabase db reset
# Puis réappliquer le schéma complet + migration
```

### Option 3 : Via psql

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" -f lib/db/migration-seo-core.sql
```

---

## Structure des données SEO

### 1. Champs SEO sur `content` (posts & pages)

#### Métas de base
- `seo_title` : Titre SEO personnalisé (fallback : `title`)
- `seo_description` : Meta description (fallback : `excerpt`)
- `seo_canonical` : URL canonique (auto-généré si null)

#### Robots
- `seo_robots_index` : Autoriser l'indexation (défaut : `true`)
- `seo_robots_follow` : Autoriser le suivi des liens (défaut : `true`)

#### Analyse SEO
- `seo_focus_keyword` : Mot-clé principal pour analyse
- `seo_score` : Score SEO calculé (0-100)

#### Open Graph (Facebook, LinkedIn)
- `seo_og_title` : Titre OG (fallback : `seo_title` → `title`)
- `seo_og_description` : Description OG
- `seo_og_image` : Image OG (fallback : `featured_media_id`)
- `seo_og_type` : Type OG (défaut : `article`)

#### Twitter Cards
- `seo_twitter_title` : Titre Twitter
- `seo_twitter_description` : Description Twitter
- `seo_twitter_image` : Image Twitter
- `seo_twitter_card` : Type de card (`summary` ou `summary_large_image`)

#### Breadcrumbs
- `seo_breadcrumb_title` : Override du titre dans le fil d'Ariane

---

### 2. Champs SEO sur `terms` (catégories & tags)

- `seo_title` : Titre SEO (fallback : `name`)
- `seo_description` : Meta description (fallback : `description`)
- `seo_canonical` : URL canonique
- `seo_robots_index` : Indexation
- `seo_robots_follow` : Suivi des liens
- Open Graph : `seo_og_title`, `seo_og_description`, `seo_og_image`
- Twitter : `seo_twitter_title`, `seo_twitter_description`, `seo_twitter_image`, `seo_twitter_card`

---

### 3. Table `seo_redirects`

Gestion des redirections SEO par site.

```sql
{
  source_path: '/ancienne-page',
  destination_path: '/nouvelle-page',
  redirect_type: 301, -- ou 302, 307, 308
  is_active: true,
  hit_count: 0 -- statistiques
}
```

**Utilisation :**
- Les redirections sont exécutées dans le middleware Next.js
- Source = chemin relatif (ex: `/blog/old-post`)
- Destination = chemin relatif ou URL complète
- `hit_count` s'incrémente à chaque redirection

---

### 4. Table `seo_settings`

Configuration SEO globale par site.

#### Templates de titre
- `title_template_post` : `{{title}} | {{siteName}}`
- `title_template_page` : `{{title}} | {{siteName}}`
- `title_template_category` : `{{name}} | {{siteName}}`
- `title_template_tag` : `{{name}} | {{siteName}}`
- `title_template_home` : `{{siteName}} – {{tagline}}`

#### Variables disponibles
- `{{title}}` : Titre du contenu
- `{{siteName}}` : Nom du site
- `{{tagline}}` : Slogan du site
- `{{name}}` : Nom de la taxonomie
- `{{category}}` : Catégorie principale
- `{{year}}` : Année de publication

#### Defaults globaux
- `default_og_image` : Image OG par défaut
- `separator` : Séparateur de titre (`|`, `-`, `–`, etc.)
- `default_locale` : Locale par défaut (`fr_FR`)

#### Social
- `twitter_username` : @username Twitter
- `facebook_app_id` : ID app Facebook

#### Knowledge Graph
- `organization_name` : Nom de l'organisation
- `organization_logo` : URL du logo (Schema.org)

#### Sitemap
- `sitemap_posts_priority` : Priorité posts (0.0-1.0, défaut: 0.8)
- `sitemap_posts_changefreq` : Fréquence posts (défaut: `weekly`)
- `sitemap_pages_priority` : Priorité pages (défaut: 0.6)
- `sitemap_pages_changefreq` : Fréquence pages (défaut: `monthly`)

---

## Valeurs par défaut

Après migration, tous les contenus existants auront :

- `seo_robots_index` = `true`
- `seo_robots_follow` = `true`
- `seo_twitter_card` = `summary_large_image`
- `seo_og_type` = `article`
- `seo_score` = `0` (sera calculé par l'analyseur)

Un enregistrement `seo_settings` est créé automatiquement pour le site de développement.

---

## Prochaines étapes

Après avoir appliqué la migration :

1. ✅ **Migration BDD** → fait !
2. 🔄 **SEO Resolver** : `/core/seo/resolver.ts` (pipeline de résolution)
3. 🔄 **SEO Box UI** : Composant React pour éditer les métas
4. 🔄 **Meta Tags Renderer** : Génération SSR des balises
5. 🔄 **SEO Analyzer** : Calcul du score SEO
6. 🔄 **Redirects Middleware** : Gestion des redirections
7. 🔄 **Sitemap Generator** : Mise à jour du sitemap avec config

---

## Vérification

Après migration, vérifier :

```sql
-- Vérifier les colonnes content
\d content

-- Vérifier les colonnes terms
\d terms

-- Vérifier la table redirects
SELECT * FROM seo_redirects LIMIT 1;

-- Vérifier les settings du site dev
SELECT * FROM seo_settings WHERE site_id = '00000000-0000-0000-0000-000000000001';
```

---

## Rollback (si nécessaire)

```sql
-- Supprimer les colonnes de content
ALTER TABLE content
DROP COLUMN seo_title,
DROP COLUMN seo_description,
DROP COLUMN seo_canonical,
DROP COLUMN seo_robots_index,
DROP COLUMN seo_robots_follow,
DROP COLUMN seo_focus_keyword,
DROP COLUMN seo_og_title,
DROP COLUMN seo_og_description,
DROP COLUMN seo_og_image,
DROP COLUMN seo_og_type,
DROP COLUMN seo_twitter_title,
DROP COLUMN seo_twitter_description,
DROP COLUMN seo_twitter_image,
DROP COLUMN seo_twitter_card,
DROP COLUMN seo_breadcrumb_title,
DROP COLUMN seo_score;

-- Supprimer les colonnes de terms
ALTER TABLE terms
DROP COLUMN seo_title,
DROP COLUMN seo_description,
DROP COLUMN seo_canonical,
DROP COLUMN seo_robots_index,
DROP COLUMN seo_robots_follow,
DROP COLUMN seo_og_title,
DROP COLUMN seo_og_description,
DROP COLUMN seo_og_image,
DROP COLUMN seo_twitter_title,
DROP COLUMN seo_twitter_description,
DROP COLUMN seo_twitter_image,
DROP COLUMN seo_twitter_card;

-- Supprimer les tables
DROP TABLE seo_redirects;
DROP TABLE seo_settings;
```

---

## Support

Pour toute question ou problème :
- Vérifier les types TypeScript dans `lib/db/types.ts`
- Consulter le document de spécification : `instructions/core/plugin_seo.md`
