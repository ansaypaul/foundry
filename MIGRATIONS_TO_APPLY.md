# Migrations à appliquer - FOUNDRY

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

## Une fois appliqué

Redémarre le serveur Next.js et teste :
1. `/admin/sites/[id]/enhance` - Enrichissement IA
2. `/admin/sites/[id]/articles/new-ai` - Génération d'articles
3. `/admin/sites/[id]/ai-jobs` - Liste des jobs

Tous les jobs IA devraient fonctionner correctement.
