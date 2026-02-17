# 📑 Content Types Refactor - Index des fichiers

## 📚 Documentation

| Fichier | Description | Priorité |
|---------|-------------|----------|
| `README_CONTENT_TYPES_REFACTOR.md` | ⭐ Guide complet | START HERE |
| `CONTENT_TYPES_REFACTOR_SUMMARY.md` | Résumé + Tests | Important |
| `CONTENT_TYPES_REFACTOR_STATUS.md` | État détaillé | Référence |
| `CONTENT_TYPES_FILES_INDEX.md` | Ce fichier (index) | Navigation |
| `MIGRATIONS_TO_APPLY.md` | Migrations (mis à jour) | Action |

---

## 🗄️ Database

### Migrations SQL

| Fichier | Description | Status |
|---------|-------------|--------|
| `lib/db/migration-editorial-content-types.sql` | Créer tables registry | ✅ Prêt |
| `lib/db/seed-editorial-content-types.sql` | Seed 10 types | ✅ Prêt |
| `lib/db/migration-content-types-retrocompat.sql` | Migration anciens articles | 🔄 TODO |

**Application:**
```sql
\i lib/db/migration-editorial-content-types.sql
\i lib/db/seed-editorial-content-types.sql
```

---

## 🔧 Services

### Nouveaux services créés

| Fichier | Description | Status | LOC |
|---------|-------------|--------|-----|
| `lib/services/contentTypes/contentTypeRegistry.ts` | Load types + overrides | ✅ Done | ~250 |
| `lib/services/contentTypes/promptBuilder.ts` | Compose AI prompts | ✅ Done | ~300 |

**Usage:**
```typescript
import { getContentTypeForSite } from '@/lib/services/contentTypes/contentTypeRegistry';
import { buildPromptFromContentType } from '@/lib/services/contentTypes/promptBuilder';
```

### Services à modifier

| Fichier | Description | Status |
|---------|-------------|--------|
| `lib/services/articles/articleValidator.ts` | Adapter validation | 🔄 TODO |
| `lib/services/ai/generateArticleFromIdea.ts` | Adapter generation | 🔄 TODO |

---

## 📐 Blueprint System

### Fichiers modifiés

| Fichier | Changements | Status |
|---------|------------|--------|
| `lib/services/blueprint/types.ts` | Retiré BlueprintContentTypeSchema | ✅ Done |
| `lib/services/blueprint/blueprintTemplateSchema.ts` | Retiré contentTypes du schema | ✅ Done |
| `lib/services/ai/generateBlueprintTemplate.ts` | IA ne génère plus contentTypes | ✅ Done |
| `lib/services/setup/applyBlueprintTemplate.ts` | Init site_content_type_settings | ✅ Done |

**Impact:** Blueprint ne contient plus contentTypes, focus sur structure (authors, categories, pages)

---

## 🌐 API Routes

### À créer

| Fichier | Endpoints | Status |
|---------|-----------|--------|
| `app/api/admin/editorial-content-types/route.ts` | GET, POST | 🔄 TODO |
| `app/api/admin/editorial-content-types/[key]/route.ts` | GET, PATCH, DELETE | 🔄 TODO |
| `app/api/admin/sites/[id]/content-type-settings/route.ts` | GET, POST | 🔄 TODO |
| `app/api/admin/sites/[id]/content-type-settings/[key]/route.ts` | GET, PATCH | 🔄 TODO |

**Permissions:**
- editorial_content_types → Super admin only
- site_content_type_settings → Site owner or admin

---

## 🎨 UI Components

### À créer

| Fichier | Description | Status |
|---------|-------------|--------|
| `app/admin/editorial-content-types/page.tsx` | Liste types | 🔄 TODO |
| `app/admin/editorial-content-types/[key]/edit/page.tsx` | Éditeur type | 🔄 TODO |
| `app/admin/sites/[id]/content-type-settings/page.tsx` | Settings site | 🔄 TODO |

**Features:**
- CRUD content types
- JSON editors (template_schema, validator_profile)
- Prompt editors
- Preview + Test
- Enable/Disable par site
- Override editor

---

## 📊 Résumé par phase

### Phase 1: Database (100% ✅)
```
✅ lib/db/migration-editorial-content-types.sql
✅ lib/db/seed-editorial-content-types.sql
```

### Phase 2A: Blueprint Refactor (100% ✅)
```
✅ lib/services/blueprint/types.ts
✅ lib/services/blueprint/blueprintTemplateSchema.ts
✅ lib/services/ai/generateBlueprintTemplate.ts
✅ lib/services/setup/applyBlueprintTemplate.ts
```

### Phase 2B: New Services (100% ✅)
```
✅ lib/services/contentTypes/contentTypeRegistry.ts
✅ lib/services/contentTypes/promptBuilder.ts
```

### Phase 2C: Adapters (0% 🔄)
```
🔄 lib/services/articles/articleValidator.ts
🔄 lib/services/ai/generateArticleFromIdea.ts
```

### Phase 3: APIs (0% 🔄)
```
🔄 app/api/admin/editorial-content-types/route.ts
🔄 app/api/admin/editorial-content-types/[key]/route.ts
🔄 app/api/admin/sites/[id]/content-type-settings/route.ts
🔄 app/api/admin/sites/[id]/content-type-settings/[key]/route.ts
```

### Phase 4: UI (0% 🔄)
```
🔄 app/admin/editorial-content-types/page.tsx
🔄 app/admin/editorial-content-types/[key]/edit/page.tsx
🔄 app/admin/sites/[id]/content-type-settings/page.tsx
```

### Phase 5: Migration (0% 🔄)
```
🔄 lib/db/migration-content-types-retrocompat.sql
```

---

## 📈 Statistiques

### Fichiers créés: 6
- 2 migrations SQL
- 2 nouveaux services TypeScript
- 4 fichiers de documentation

### Fichiers modifiés: 4
- 2 blueprint schemas
- 1 blueprint generator
- 1 apply engine

### Fichiers à créer: ~10
- 1 migration retrocompat
- 1 validator adapter
- 1 article factory adapter
- 4 API routes
- 3 UI pages

### Total lignes de code: ~1500
- SQL: ~800 lignes
- TypeScript (done): ~550 lignes
- TypeScript (to do): ~150 lignes (estimate)
- React UI (to do): ~500 lignes (estimate)

---

## 🚀 Quick Navigation

### Pour commencer
1. Lire: `README_CONTENT_TYPES_REFACTOR.md`
2. Appliquer: Migrations SQL
3. Tester: Voir `CONTENT_TYPES_REFACTOR_SUMMARY.md`

### Pour développer
1. Services: `lib/services/contentTypes/`
2. APIs: `app/api/admin/editorial-content-types/`
3. UI: `app/admin/editorial-content-types/`

### Pour debugger
1. Vérifier: `CONTENT_TYPES_REFACTOR_STATUS.md`
2. Migrations: `MIGRATIONS_TO_APPLY.md`
3. Database: Tables `editorial_content_types`, `site_content_type_settings`

---

## 🔍 Recherche rapide

### Trouver un type de contenu
```sql
SELECT * FROM editorial_content_types WHERE key = 'top10';
```

### Voir types d'un site
```sql
SELECT 
  ect.key,
  ect.label,
  scts.is_enabled
FROM site_content_type_settings scts
JOIN editorial_content_types ect ON ect.id = scts.content_type_id
WHERE scts.site_id = 'your-site-id';
```

### Charger un type en TypeScript
```typescript
import { getContentTypeForSite } from '@/lib/services/contentTypes/contentTypeRegistry';
const type = await getContentTypeForSite(siteId, 'top10');
```

---

## 📞 Support

- **Problème migrations:** Vérifier `MIGRATIONS_TO_APPLY.md`
- **Problème code:** Vérifier `CONTENT_TYPES_REFACTOR_STATUS.md`
- **Questions architecture:** Lire `README_CONTENT_TYPES_REFACTOR.md`
- **Tests:** Suivre `CONTENT_TYPES_REFACTOR_SUMMARY.md`

---

**Dernière mise à jour:** 2026-02-17  
**Progress:** 7/13 tasks (54%)  
**Status:** Fondations complètes, prêt pour tests ou implémentation suite
