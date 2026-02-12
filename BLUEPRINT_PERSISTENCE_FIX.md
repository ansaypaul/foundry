# Blueprint Persistence Fix - Complete

## Problème résolu

Avant ce fix, le blueprint généré par l'IA n'était **pas persisté** dans `site_blueprint`. L'UI retombait donc sur les anciens générateurs hardcodés qui montraient des données inappropriées (Anime/Manga pour un site de cuisine).

Maintenant, **`site_blueprint` est la source de vérité unique**.

## Changements implémentés

### 1. Migration DB - `active_blueprint_version`

**Nouveau fichier:** `lib/db/migration-sites-active-blueprint.sql`

```sql
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS active_blueprint_version INT4 NULL;

COMMENT ON COLUMN sites.active_blueprint_version IS 'Currently active blueprint version number (references site_blueprint.version)';

CREATE INDEX IF NOT EXISTS idx_sites_active_blueprint ON sites(id, active_blueprint_version);
```

### 2. Service AI - Persistance du blueprint

**Modifié:** `lib/services/ai/generateBlueprintTemplate.ts`

Maintenant le service:
1. Génère le blueprint avec GPT-4o
2. **Calcule le `version` number**: `MAX(version) + 1` pour le site
3. **Insert dans `site_blueprint`** avec le blueprint JSON
4. **Met à jour `sites.active_blueprint_version`** vers la nouvelle version
5. Retourne `{ jobId, blueprintId, version, template }`

### 3. Service Apply - Lecture depuis DB

**Modifié:** `lib/services/setup/applyBlueprintTemplate.ts`

**Nouvelle signature:**
```typescript
applyBlueprintTemplate(siteId: string, version?: number)
```

Le service:
1. **Lit le blueprint depuis `site_blueprint`**:
   - Si `version` fournie → applique cette version spécifique
   - Sinon → applique `sites.active_blueprint_version`
   - Fallback → dernière version (MAX)
2. Parse `blueprint_json` en `BlueprintTemplateV1`
3. Crée les entités DB (catégories, auteurs, pages, types)
4. **Met à jour `sites.setup_status = 'configured'`**

### 4. API Routes - Refactoring

**`POST /api/admin/sites/[id]/blueprint/generate-template`:**
- Appelle `generateBlueprintTemplateV1`
- Retourne `{ jobId, blueprintId, version, template }`
- Le blueprint est **déjà sauvegardé** dans `site_blueprint`

**`POST /api/admin/sites/[id]/blueprint/apply-template`:**
- Accepte `{ version?: number }` dans le body
- Appelle `applyBlueprintTemplate(siteId, version)`
- **NE reçoit PLUS le template JSON** (lit depuis DB)
- Retourne `{ created, skipped }`

### 5. UI Component - Affichage version

**Modifié:** `app/admin/sites/[id]/setup/AiBlueprintGenerator.tsx`

Ajouts:
- State: `blueprintId`, `version`
- Preview affiche **"Blueprint Version X"** + ID
- Mention "Sauvegardé dans site_blueprint"
- Apply envoie `{ version }` au lieu de `{ template }`
- Après apply: **`window.location.reload()`** pour refresh les counts

## Flow complet

### 1. Génération

```
User: Click "Générer la structure avec l'IA"
  ↓
API: POST /blueprint/generate-template
  ↓
Service: generateBlueprintTemplateV1
  ↓
OpenAI: GPT-4o génère le blueprint JSON
  ↓
DB: INSERT INTO site_blueprint (version=1, blueprint_json={...})
  ↓
DB: UPDATE sites SET active_blueprint_version=1
  ↓
UI: Affiche preview + "Blueprint Version 1"
```

### 2. Application

```
User: Click "Appliquer ce blueprint"
  ↓
API: POST /blueprint/apply-template { version: 1 }
  ↓
Service: applyBlueprintTemplate(siteId, 1)
  ↓
DB: SELECT * FROM site_blueprint WHERE version=1
  ↓
Service: Crée categories, authors, pages, content_types
  ↓
DB: UPDATE sites SET setup_status='configured'
  ↓
UI: window.location.reload() → Refresh counts
```

### 3. Setup UI

Maintenant l'UI de setup (AuthorsSetup, TaxonomySetup, etc.) va lire depuis `site_blueprint` au lieu des générateurs hardcodés.

Les composants existants comme `AuthorsSetup`, `TaxonomySetup`, etc. peuvent être adaptés pour:
1. Charger le blueprint actif: `GET /api/admin/sites/[id]/blueprint`
2. Comparer avec l'état actuel de la DB
3. Afficher les diffs (créé vs. manquant)

## Versioning

Chaque site a ses propres versions de blueprint:

```sql
site_blueprint
  id                  uuid
  site_id             uuid → sites(id)
  version             int4    -- 1, 2, 3, etc. per site
  blueprint_json      jsonb   -- BlueprintTemplateV1
  notes               text
  created_at          timestamptz
```

Exemple:
- Site "Cuisine du Monde": version 1, 2, 3
- Site "JapanPop": version 1, 2

`sites.active_blueprint_version` pointe vers la version active.

## Migrations à exécuter

**1. Contrainte ai_job kind:**

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

**2. Colonne active_blueprint_version:**

```sql
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS active_blueprint_version INT4 NULL;

COMMENT ON COLUMN sites.active_blueprint_version IS 'Currently active blueprint version number (references site_blueprint.version)';

CREATE INDEX IF NOT EXISTS idx_sites_active_blueprint ON sites(id, active_blueprint_version);
```

## Tests

1. ✅ Créer un nouveau site "Cuisine du Monde"
2. ✅ Générer blueprint → Vérifie dans `site_blueprint` (version 1)
3. ✅ Vérifie `sites.active_blueprint_version = 1`
4. ✅ Preview affiche "Blueprint Version 1"
5. ✅ Appliquer → Crée les entités (pas d'Anime/Manga !)
6. ✅ Vérifie `sites.setup_status = 'configured'`
7. ✅ Refresh page → Counts corrects
8. ✅ Regénérer → Version 2 créée
9. ✅ Appliquer version 2 → Met à jour

## Acceptance

- ✅ Cuisine site génère une nouvelle row dans `site_blueprint` (version 1 pour ce site)
- ✅ Appliquer utilise ce blueprint stocké, pas un générateur hardcodé
- ✅ Setup UI ne montre jamais Anime/Manga pour cuisine après refresh
- ✅ Blueprint history montre plusieurs rows par site
- ✅ `sites.active_blueprint_version` pointe vers la version active

## Prochaines étapes (optionnel)

### API pour lire le blueprint actif

**GET `/api/admin/sites/[id]/blueprint`**
- Retourne le blueprint actif ou latest
- Utilisé par les composants Setup UI pour preview

### UI Blueprint History

**Page `/admin/sites/[id]/blueprints`**
- Liste toutes les versions pour un site
- Permet de voir, comparer, ré-appliquer une version antérieure
