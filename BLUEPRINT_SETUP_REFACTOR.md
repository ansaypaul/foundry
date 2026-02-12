# Blueprint Setup Refactor - Complete Fix

## Problème résolu

**Avant:** Les sections "À créer" sur `/sites/[id]/setup` utilisaient les anciens générateurs hardcodés (Decision Engine + buildAuthorsPlan/buildCategoryPlan), ignorant complètement le blueprint généré par l'IA.

**Résultat:** Un site "Cuisine du Monde" affichait des catégories JapanPop (Anime, Manga) après génération du blueprint.

**Après:** Toutes les sections lisent **exclusivement depuis `site_blueprint`** (table). Les générateurs hardcodés ne sont PLUS utilisés.

## Architecture refactorée

### 1. Loader centralisé - `getActiveBlueprint(siteId)`

**Nouveau fichier:** `lib/services/blueprint/getActiveBlueprint.ts`

**Logique:**
1. Charge `sites.active_blueprint_version`
2. Si défini → Charge cette version depuis `site_blueprint`
3. Sinon → Charge `MAX(version)` (latest)
4. Retourne `{ exists, version, blueprintId, blueprint }`

**Usage:** Toutes les API routes de setup l'utilisent maintenant.

### 2. Refactor complet des API Routes

**Pattern uniforme:**

```typescript
// GET: Preview
1. Load site
2. Load active blueprint via getActiveBlueprint()
3. If no blueprint → 404 "Générez d'abord un blueprint"
4. Read desired items from blueprint_json (authors/categories/pages/contentTypes)
5. Load existing items from DB (filter by site_id)
6. Compute diff: missing = desired - existing
7. Return { source: "Blueprint vX", plan, existingCount, missingXXX }

// POST: Apply
1. Load site
2. Load active blueprint
3. Read desired items from blueprint_json
4. Load existing items from DB
5. Compute diff
6. Insert only missing items
7. Return { message, created }
```

### Routes refactorées

✅ **`/api/admin/sites/[id]/setup/authors`**
- GET: Lit `blueprint.authors`
- POST: Crée authors manquants depuis `blueprint.authors`
- Diff key: `role_key`

✅ **`/api/admin/sites/[id]/setup/taxonomy`**
- GET: Lit `blueprint.taxonomy.categories`
- POST: Crée categories manquantes depuis `blueprint.taxonomy.categories`
- Diff key: `slug`

✅ **`/api/admin/sites/[id]/setup/pages`**
- GET: Lit `blueprint.pages`
- POST: Crée pages manquantes depuis `blueprint.pages`
- Diff key: `slug`

✅ **`/api/admin/sites/[id]/setup/content-types`**
- GET: Lit `blueprint.contentTypes`
- POST: Crée content types manquants depuis `blueprint.contentTypes`
- Diff key: `key`

### 3. UI Components - Badge "Source: Blueprint vX"

**Ajouté dans tous les composants Setup:**
- `AuthorsSetup.tsx`
- `TaxonomySetup.tsx`
- `MandatoryPagesSetup.tsx`
- `ContentTypesSetup.tsx`

Badge affiché si l'API retourne `source`:

```tsx
{(preview as any).source && (
  <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
    <p className="text-sm text-purple-200">
      📋 Source: {(preview as any).source}
    </p>
  </div>
)}
```

### 4. Types TypeScript

**Modifié:** `lib/db/types.ts`

```typescript
export interface Site {
  // ... existing fields
  active_blueprint_version: number | null;
}
```

## Flow complet maintenant

### Scénario 1: Génération + Preview + Apply

```
1. User: "Générer la structure avec l'IA"
   ↓
2. Service: generateBlueprintTemplateV1
   ↓
3. OpenAI: GPT-4o génère blueprint JSON
   ↓
4. DB: INSERT site_blueprint (version=1, blueprint_json={...})
   ↓
5. DB: UPDATE sites SET active_blueprint_version=1
   ↓
6. UI: Preview blueprint → "Blueprint Version 1"
   ↓
7. User: "Appliquer ce blueprint"
   ↓
8. Service: applyBlueprintTemplate(siteId, version=1)
   ↓
9. DB: SELECT blueprint_json FROM site_blueprint WHERE version=1
   ↓
10. DB: CREATE categories/authors/pages/contentTypes FROM blueprint_json
    ↓
11. UI: Reload page
    ↓
12. Setup sections: GET /setup/authors (etc.)
    ↓
13. API: getActiveBlueprint() → version=1
    ↓
14. API: Read blueprint_json.authors
    ↓
15. API: Diff with existing authors
    ↓
16. UI: Show "À créer" (0 items) ✓ + "Source: Blueprint v1"
```

### Scénario 2: Site existant (JapanPop v1)

```
1. User: Va sur /sites/[japanpop]/setup
   ↓
2. API: getActiveBlueprint(japanpop)
   ↓
3. DB: active_blueprint_version = 1 (ou MAX=1)
   ↓
4. DB: SELECT blueprint_json FROM site_blueprint WHERE version=1
   ↓
5. blueprint_json.taxonomy.categories = ["anime", "manga", ...]
   ↓
6. DB: SELECT terms WHERE type='category'
   ↓
7. Existing: ["anime", "manga", ...]
   ↓
8. Diff: missing = []
   ↓
9. UI: "✓ Toutes les catégories sont créées" + "Source: Blueprint v1"
```

### Scénario 3: Nouveau site Cuisine

```
1. User: Créer site "Cuisine du Monde"
   ↓
2. User: Générer blueprint
   ↓
3. blueprint_json.taxonomy.categories = ["recettes", "techniques", ...]
   ↓
4. User: Appliquer
   ↓
5. DB: CREATE categories FROM blueprint
   ↓
6. Reload
   ↓
7. UI: "✓ 6 catégories déjà créées" + "Source: Blueprint v1"
   ↓
RÉSULTAT: Aucun "Anime" ou "Manga" visible ! ✓
```

## Différences clés

### Avant (MAUVAIS)

```typescript
// API /setup/authors GET
const profile = computeSiteDecisionProfile(...); // Hardcodé
const plan = buildAuthorsPlan(...); // Générateur legacy
// → Retourne toujours les mêmes auteurs génériques
```

### Après (CORRECT)

```typescript
// API /setup/authors GET
const blueprintResult = await getActiveBlueprint(siteId);
const desiredAuthors = blueprintResult.blueprint.authors; // Depuis DB
// → Retourne les auteurs du blueprint sauvegardé
```

## Garanties

✅ **Single source of truth:** `site_blueprint` est la référence unique
✅ **No cross-site leakage:** Toutes les queries filtrent par `site_id`
✅ **No legacy fallback:** Si pas de blueprint → Erreur "Générez d'abord"
✅ **Diff correct:** Compare `desired` (blueprint) vs `existing` (DB)
✅ **Versioning:** Chaque site a ses propres versions
✅ **UI feedback:** Badge "Source: Blueprint vX" confirme quelle version est utilisée

## Fichiers modifiés

### Services:
- ✅ `lib/services/blueprint/getActiveBlueprint.ts` (NEW)
- ✅ `lib/services/ai/generateBlueprintTemplate.ts` (persist blueprint)
- ✅ `lib/services/setup/applyBlueprintTemplate.ts` (read from DB)

### API Routes:
- ✅ `app/api/admin/sites/[id]/setup/authors/route.ts`
- ✅ `app/api/admin/sites/[id]/setup/taxonomy/route.ts`
- ✅ `app/api/admin/sites/[id]/setup/pages/route.ts`
- ✅ `app/api/admin/sites/[id]/setup/content-types/route.ts`

### UI Components:
- ✅ `app/admin/sites/[id]/setup/AuthorsSetup.tsx` (badge)
- ✅ `app/admin/sites/[id]/setup/TaxonomySetup.tsx` (badge)
- ✅ `app/admin/sites/[id]/setup/MandatoryPagesSetup.tsx` (badge)
- ✅ `app/admin/sites/[id]/setup/ContentTypesSetup.tsx` (badge)

### Types:
- ✅ `lib/db/types.ts` (Site interface avec `active_blueprint_version`)

### Migrations:
- ✅ `lib/db/migration-sites-active-blueprint.sql`
- ✅ `MIGRATIONS_TO_APPLY.md` (section 8 ajoutée)

## Tests de validation

### Test 1: Blueprint Cuisine

```sql
-- Check blueprint saved
SELECT id, site_id, version, blueprint_json->'taxonomy'->'categories' 
FROM site_blueprint 
WHERE site_id = 'cuisine-uuid';

-- Expected: version=1, categories=["recettes", "techniques", ...]
```

### Test 2: Setup UI reads blueprint

```
1. Navigate to /sites/[cuisine]/setup
2. Check "Catégories à créer"
3. Expected: List shows "recettes", "techniques", etc.
4. Expected: Badge "📋 Source: Blueprint v1" visible
5. Expected: NO "Anime", NO "Manga"
```

### Test 3: Apply creates correct items

```
1. Click "Créer les catégories"
2. Check DB: SELECT * FROM terms WHERE site_id='cuisine-uuid'
3. Expected: Categories match blueprint_json
4. Expected: Slugs are "recettes", "techniques"
5. Expected: NO legacy/hardcoded categories
```

### Test 4: Idempotency

```
1. Apply blueprint
2. Refresh page
3. Check "À créer" sections
4. Expected: All show "✓ Tous les X sont créés"
5. Expected: Counts match blueprint
```

## Migration SQL à exécuter

**Important:** Tu dois exécuter ces 2 migrations dans l'ordre:

### 1. Contrainte ai_job.kind (si pas déjà fait)

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

### 2. Colonne active_blueprint_version (NOUVEAU)

```sql
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS active_blueprint_version INT4 NULL;

COMMENT ON COLUMN sites.active_blueprint_version IS 'Currently active blueprint version number (references site_blueprint.version)';

CREATE INDEX IF NOT EXISTS idx_sites_active_blueprint ON sites(id, active_blueprint_version);
```

## Acceptance

- ✅ Après génération blueprint pour un site, "À créer" match le blueprint_json (pas legacy)
- ✅ Si entités créées par apply, "À créer" devient vide
- ✅ Aucun cross-site leakage, toutes queries filtrent par site_id
- ✅ Badge "Source: Blueprint vX" visible dans chaque section
- ✅ Cuisine site ne montre JAMAIS des catégories JapanPop
- ✅ Apply lit depuis site_blueprint (pas de template JSON en mémoire)
