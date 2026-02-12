# AI Blueprint Generator v1

## Vue d'ensemble

Le **AI Blueprint Generator** génère automatiquement toute la structure d'un site (catégories, auteurs, pages, types de contenu) adaptée à la niche en utilisant l'IA.

## Caractéristiques

✅ **Génération intelligente** - Analyse la description du site pour créer une structure adaptée à la niche
✅ **Preview avant application** - Visualisez le blueprint avant de l'appliquer
✅ **Validation stricte** - Schema Zod garantit la cohérence des données
✅ **Idempotent** - Skip les éléments existants, pas de doublons
✅ **Logging complet** - Tous les jobs sont loggés dans `ai_job`
✅ **No emojis, no long dash** - Respect des règles éditoriales strictes
✅ **Slugs propres** - Kebab-case, ASCII uniquement

## Architecture

### 1. Schéma Blueprint (`blueprintTemplateSchema.ts`)

```typescript
BlueprintTemplateV1 {
  version: 1,
  site: { name, language, country, siteType, ambitionLevel, nicheSummary },
  taxonomy: { categories: [...] },
  authors: [...],
  pages: [...], // Always 5 mandatory pages
  contentTypes: [...],
  seoDefaults: {...}
}
```

**Contraintes par ambition:**
- `starter`: 4-6 catégories, 2-3 auteurs, 3-4 content types
- `growth`: 6-10 catégories, 3-5 auteurs, 4-6 content types
- `factory`: 10-16 catégories, 5-8 auteurs, 6-8 content types

### 2. Service AI (`generateBlueprintTemplate.ts`)

- Charge les données du site depuis `sites` (pas de nouvelle table)
- Crée un `ai_job` (kind: `generate_blueprint_template`)
- Appelle OpenAI GPT-4o avec des prompts stricts
- Valide le JSON avec Zod
- **Retry automatique** si validation échoue (max 2 tentatives)
- Logs complets dans `ai_job.output_json`

**Prompts:**
- Système: Instructions strictes sur le format JSON, contraintes, règles
- User: Contexte du site (name, description, niche, language, country)
- Retry: Si invalide, renvoie les erreurs de validation pour correction

### 3. Service Apply (`applyBlueprintTemplate.ts`)

Applique le blueprint en créant les enregistrements DB:

**Idempotent:**
- Vérifie l'existence par `slug` avant insertion
- Skip si existe déjà (pas de doublon)
- Retourne `created` et `skipped` counts

**Créations:**
1. **Catégories** → `terms` table (type: 'category')
2. **Auteurs** → `authors` table (isAi: true)
3. **Pages** → `content` table (type: 'page', status: 'draft')
4. **Types de contenu** → `content_type` table
5. **SEO minimal** → `seo_meta` (pour site/pages/categories)

### 4. API Routes

**POST** `/api/admin/sites/[id]/blueprint/generate-template`
- Génère le blueprint avec l'IA
- Retourne `{ jobId, template }`

**POST** `/api/admin/sites/[id]/blueprint/apply-template`
- Body: `{ template }`
- Applique le blueprint en DB
- Retourne `{ created, skipped }`

### 5. UI Component (`AiBlueprintGenerator.tsx`)

**Flow:**
1. Bouton "Générer la structure avec l'IA"
2. Appel API → génération avec OpenAI
3. **Preview du blueprint:**
   - Résumé de niche
   - Liste des catégories (avec priorité visuelle)
   - Liste des auteurs (avec spécialités)
   - Types de contenu (avec règles)
   - Pages obligatoires
4. Bouton "Appliquer" ou "Régénérer"
5. Success message + lien vers job IA

## Utilisation

1. Va sur `/admin/sites/[id]/setup`
2. Clique sur "Générer la structure avec l'IA"
3. Attends la génération (GPT-4o)
4. Preview le blueprint
5. Clique sur "Appliquer"
6. ✅ Structure créée !

## Règles de génération

### Catégories
- **NO generic categories** (pas de "Accueil", "Blog", "Articles")
- Spécifiques à la niche (ex: cuisine → "recettes", "techniques", "ingrédients")
- Priority: 1 = core, 2 = secondary, 3 = supplementary
- Slugs: kebab-case, ASCII, lowercase

### Auteurs
- Roles adaptés à la niche (ex: "Chef", "Recipe Editor" pour cuisine)
- Spécialités pertinentes
- `isAi: true` par défaut
- Display names en français si `site.language === 'fr'`

### Pages
- **Toujours 5 pages obligatoires:**
  - À propos (`a-propos`)
  - Contact (`contact`)
  - Mentions légales (`mentions-legales`)
  - Politique de confidentialité (`politique-de-confidentialite`)
  - Conditions générales (`conditions-generales-utilisation`)

### Content Types
- Adaptés au type de site (recipes, guides, news, reviews)
- Rules strictes: `minWords`, `h2Min`, `noEmojis`, `noLongDash`
- HTML tags autorisés: `h2`, `p`, `ul`, `li`, `b`, `i`, `strong`, `em`

### SEO Defaults
- Templates: `{{title}} | {{siteName}}`
- Strategy: `excerpt_or_first_paragraph_155`
- OG defaults: `article`, `index: true`, `follow: true`

## Logging

Tous les jobs sont loggés dans `ai_job`:

```typescript
{
  kind: 'generate_blueprint_template',
  status: 'running' | 'done' | 'error',
  input_json: { siteName, siteDescription, language, country, ... },
  output_json: { 
    template: BlueprintTemplateV1,
    validationErrors: []
  },
  error_code: 'GENERATION_FAILED',
  error_message: '...'
}
```

Visible dans `/admin/sites/[id]/ai-jobs` avec filtre "Génération blueprint".

## Migration SQL

Mettre à jour la contrainte `ai_job.kind`:

```sql
ALTER TABLE ai_job
  DROP CONSTRAINT IF EXISTS ai_job_kind_check;

ALTER TABLE ai_job
  ADD CONSTRAINT ai_job_kind_check 
  CHECK (kind IN (
    'article_generate', 
    'content_rewrite', 
    'seo_optimize', 
    'enrich_categories', 
    'enrich_authors',
    'enrich_pages',
    'generate_blueprint_template'
  ));
```

## Prochaines étapes (optionnel)

### Chaînage automatique
Après l'application du blueprint, enchaîner automatiquement:
1. SEO Bootstrap (si pas déjà fait)
2. Enrichissement catégories (descriptions + SEO)
3. Enrichissement auteurs (bios)
4. Enrichissement pages (HTML)
5. Snapshot blueprint

Bouton "Auto Setup Complete" qui fait tout d'un coup.

## Fichiers créés/modifiés

### Nouveaux fichiers
- `lib/services/blueprint/blueprintTemplateSchema.ts`
- `lib/services/ai/generateBlueprintTemplate.ts`
- `lib/services/setup/applyBlueprintTemplate.ts`
- `app/api/admin/sites/[id]/blueprint/generate-template/route.ts`
- `app/api/admin/sites/[id]/blueprint/apply-template/route.ts`
- `app/admin/sites/[id]/setup/AiBlueprintGenerator.tsx`

### Modifiés
- `lib/db/types.ts` (AIJob kind union)
- `lib/db/migration-ai-job-add-enrichment-kinds.sql` (constraint)
- `app/admin/sites/[id]/setup/page.tsx` (intégration composant)
- `app/admin/sites/[id]/ai-jobs/page.tsx` (filtre + labels)
- `MIGRATIONS_TO_APPLY.md` (constraint SQL)

## Tests

Tester avec différents types de sites:
- **Cuisine**: doit produire "recettes", "techniques", "ingrédients", "cuisines-du-monde"
- **Tech**: doit produire "tutoriels", "actualites", "tests", "comparatifs"
- **Gaming**: doit produire "actualites", "tests", "guides", "esport"
- **JapanPop**: doit produire "manga", "anime", "culture-japonaise", "jeux-video"

Vérifier:
- ✅ Pas de catégories génériques
- ✅ Slugs propres (kebab-case)
- ✅ Pas d'emojis
- ✅ Pas de long dash (—)
- ✅ Counts respectent les contraintes
- ✅ Idempotence (re-apply ne crée pas de doublons)
