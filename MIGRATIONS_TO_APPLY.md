# Migrations à appliquer - FOUNDRY

## ⚠️ NOUVELLE MIGRATION PRIORITAIRE - Content Types Refactor

**IMPORTANT:** Une nouvelle migration pour le refactor des Content Types est disponible.  
Elle doit être appliquée AVANT de créer de nouveaux sites.

### 🆕 Migration Content Types (PRIORITÉ 1)
```sql
-- Fichier: lib/db/migration-editorial-content-types.sql
-- Crée le nouveau système de Content Types Registry

-- Tables créées:
-- - editorial_content_types (registry global)
-- - site_content_type_settings (pivot + overrides)
-- - content.content_type_id (nouvelle colonne)

-- Voir: CONTENT_TYPES_REFACTOR_SUMMARY.md pour détails complets
```

### 🌱 Seed Content Types (PRIORITÉ 1)
```sql
-- Fichier: lib/db/seed-editorial-content-types.sql
-- Seed 10 types de contenu standards

-- Types créés: top10, news, guide, howto, review, 
--              comparison, interview, explainer, opinion, evergreen
```

---

## Ordre d'application

Exécute ces migrations dans Supabase SQL Editor (ou ton outil DB) :

### 1. ✅ Migration AI Job (mise à jour + enrichment kinds)
```sql
-- Fichier: lib/db/migration-ai-job.sql
-- Ajoute error_code, started_at, finished_at ET nouveaux kinds

-- Add new columns if they don't exist
ALTER TABLE ai_job
  ADD COLUMN IF NOT EXISTS error_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- Drop and recreate kind constraint with new values
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

CREATE INDEX IF NOT EXISTS idx_ai_job_site_id ON ai_job(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_status ON ai_job(site_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_job_created ON ai_job(created_at DESC);

COMMENT ON COLUMN ai_job.kind IS 'Type of AI job: article_generate, content_rewrite, seo_optimize, enrich_categories, enrich_authors, enrich_pages, generate_blueprint_template';

-- ====================================
-- 8. Add active_blueprint_version to sites
-- ====================================

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS active_blueprint_version INT4 NULL;

COMMENT ON COLUMN sites.active_blueprint_version IS 'Currently active blueprint version number (references site_blueprint.version)';

CREATE INDEX IF NOT EXISTS idx_sites_active_blueprint ON sites(id, active_blueprint_version);

-- ====================================
-- 9. Expand setup_status enum for progressive onboarding
-- ====================================

-- Step 1: Drop existing constraint FIRST (to allow UPDATE)
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS check_setup_status;

ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS sites_setup_status_check;

-- Step 2: Migrate existing 'configured' sites to 'blueprint_applied'
UPDATE sites
  SET setup_status = 'blueprint_applied'
  WHERE setup_status = 'configured';

-- Step 3: Add new constraint with expanded enum
ALTER TABLE sites
  ADD CONSTRAINT sites_setup_status_check 
  CHECK (setup_status IN ('draft', 'blueprint_applied', 'enriched'));

COMMENT ON COLUMN sites.setup_status IS 'Setup status: draft (initial), blueprint_applied (structure created), enriched (content enriched)';
COMMENT ON COLUMN ai_job.error_code IS 'Error code for failed jobs (VALIDATION_FAILED, OPENAI_ERROR, etc.)';
COMMENT ON COLUMN ai_job.started_at IS 'When the job started processing';
COMMENT ON COLUMN ai_job.finished_at IS 'When the job completed or failed';
```

### 2. ✅ Migration AI Job - Link Article
```sql
-- Fichier: lib/db/migration-ai-job-link-article.sql
-- Ajoute ai_job_id à la table content

ALTER TABLE content
  ADD COLUMN IF NOT EXISTS ai_job_id UUID REFERENCES ai_job(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_content_ai_job_id ON content(ai_job_id);

COMMENT ON COLUMN content.ai_job_id IS 'Reference to AI job that generated this article (if AI-generated)';
```

### 3. ✅ Migration SEO - Add Author Entity
```sql
-- Fichier: lib/db/migration-seo-add-author-entity.sql
-- Ajoute 'author' aux entity types de seo_meta

ALTER TABLE seo_meta
  DROP CONSTRAINT IF EXISTS seo_meta_entity_type_check;

ALTER TABLE seo_meta
  ADD CONSTRAINT seo_meta_entity_type_check 
  CHECK (entity_type IN ('content', 'term', 'site', 'author'));

COMMENT ON TABLE seo_meta IS 'Métadonnées SEO centralisées pour toutes les entités (content, terms, sites, authors)';
COMMENT ON COLUMN seo_meta.entity_type IS 'Type d''entité : content, term, site, author';
```

---

## Vérification

Après application, vérifie que ça fonctionne :

```sql
-- Check ai_job structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_job' 
ORDER BY ordinal_position;

-- Check content has ai_job_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content' AND column_name = 'ai_job_id';

-- Check seo_meta constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'seo_meta_entity_type_check';
```

---

---

## 🆕 4. Migration Research Engine (NOUVEAU - PRIORITAIRE)

### A. Créer les tables research
```sql
-- Fichier: lib/db/migration-research-engine.sql
\i lib/db/migration-research-engine.sql
```

### B. Seed les configurations research
```sql
-- Fichier: lib/db/seed-research-config.sql
\i lib/db/seed-research-config.sql
```

### C. Ajouter PERPLEXITY_API_KEY ⚠️ IMPORTANT
```bash
# Dans votre fichier .env (root du projet)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx

# Obtenir une clé: https://www.perplexity.ai/settings/api
```

**IMPORTANT:** Sans cette clé, la recherche sera skipée pour les types qui la requièrent.

---

## ✅ 5. Migration Content Types Registry (APPLIQUÉE)

### A. Créer les tables ✅
```sql
-- Fichier: lib/db/migration-editorial-content-types.sql
\i lib/db/migration-editorial-content-types.sql
```

### B. Seed les types standards ✅
```sql
-- Fichier: lib/db/seed-editorial-content-types.sql
\i lib/db/seed-editorial-content-types.sql
```

### C. Initialiser les types pour les sites existants ✅ IMPORTANT
```sql
-- Fichier: lib/db/migration-init-existing-sites-content-types.sql
-- Active tous les types de contenu pour les sites existants
\i lib/db/migration-init-existing-sites-content-types.sql
```

### D. Migration rétrocompatibilité (optionnel)
```sql
-- Fichier: lib/db/migration-content-types-retrocompat.sql
-- Migre les anciens articles (content_type_key → content_type_id)
\i lib/db/migration-content-types-retrocompat.sql
```

### C. Vérification
```sql
-- Vérifier que 10 types sont créés
SELECT key, label, is_system, is_active 
FROM editorial_content_types 
ORDER BY key;

-- Devrait afficher: comparison, evergreen, explainer, guide, howto, 
--                   interview, news, opinion, review, top10
```

**Important:** Ce refactor change fondamentalement la gestion des content types.  
Les content types ne sont plus générés par le blueprint IA, mais gérés via un registry central.

**Voir documentation complète:** `CONTENT_TYPES_REFACTOR_SUMMARY.md`

---

## Une fois appliqué

Redémarre le serveur Next.js et teste :
1. `/admin/sites/new` - Créer un nouveau site
2. `/admin/sites/[id]/setup` - Générer blueprint (sans contentTypes ✅)
3. Vérifier `site_content_type_settings` est initialisé
4. `/admin/sites/[id]/articles/new-ai` - Génération d'articles (à adapter)
5. `/admin/sites/[id]/ai-jobs` - Liste des jobs

**Note:** La génération d'articles nécessite adaptation du code (voir TODO #8 et #9 dans CONTENT_TYPES_REFACTOR_SUMMARY.md)
