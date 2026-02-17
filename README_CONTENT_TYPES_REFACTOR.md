# 📘 Content Types Refactor - Guide Complet

## 🎯 Vue d'ensemble

Ce refactor transforme fondamentalement la gestion des types de contenu dans Foundry :

**Avant ❌:**
- Content types générés par IA dans chaque blueprint
- Doublons, incohérences, variations
- Impossible de gérer manuellement
- Mélangé avec la structure du site

**Après ✅:**
- Content types dans un registry central stable
- Templates + Prompts + Validation définis
- Éditable via UI admin
- Overrides par site possibles
- Séparation structure/rédaction

---

## 📊 État d'avancement

**7/13 tâches complétées (54%)**

✅ **Phase 1: Database & Schema (100%)**
- Migration SQL
- Seed 10 types standards
- Blueprint refactor
- Blueprint generator update
- Apply engine refactor

✅ **Phase 2: Services (100%)**
- ContentTypeRegistry service
- PromptBuilder service

🔄 **Phase 2 (suite): Adapters (0%)**
- Validator refactor
- Article Factory refactor

🔄 **Phase 3: Admin APIs (0%)**
- Editorial Content Types API
- Site Settings API

🔄 **Phase 4: Admin UI (0%)**
- Content Types CRUD UI
- Site Settings UI

🔄 **Phase 5: Migration (0%)**
- Script rétrocompatibilité

---

## 📚 Documentation disponible

### Fichiers principaux

| Fichier | Description |
|---------|-------------|
| `CONTENT_TYPES_REFACTOR_STATUS.md` | État détaillé + architecture |
| `CONTENT_TYPES_REFACTOR_SUMMARY.md` | Résumé + guide de test ⭐ |
| `README_CONTENT_TYPES_REFACTOR.md` | Ce fichier (vue d'ensemble) |
| `MIGRATIONS_TO_APPLY.md` | Migrations à appliquer (mis à jour) |

### Fichiers de migration

| Fichier | Description |
|---------|-------------|
| `lib/db/migration-editorial-content-types.sql` | Création tables |
| `lib/db/seed-editorial-content-types.sql` | Seed 10 types |

### Nouveaux services

| Fichier | Description |
|---------|-------------|
| `lib/services/contentTypes/contentTypeRegistry.ts` | Charger types + overrides |
| `lib/services/contentTypes/promptBuilder.ts` | Composer prompts IA |

---

## 🚀 Quick Start

### 1. Appliquer les migrations

```sql
-- Dans Supabase SQL Editor
\i lib/db/migration-editorial-content-types.sql
\i lib/db/seed-editorial-content-types.sql

-- Vérifier
SELECT key, label FROM editorial_content_types ORDER BY key;
-- Résultat attendu: 10 types
```

### 2. Tester la génération de blueprint

```bash
# 1. Créer un site
# UI: /admin/sites/new

# 2. Générer blueprint
# UI: /admin/sites/[id]/setup
# Click: "Générer avec l'IA"

# 3. Vérifier dans DB
SELECT * FROM site_blueprint WHERE site_id = 'votre-id';
# blueprint_json ne doit PAS contenir "contentTypes" ✅

# 4. Vérifier site_content_type_settings
SELECT 
  s.key,
  s.label,
  scts.is_enabled
FROM site_content_type_settings scts
JOIN editorial_content_types s ON s.id = scts.content_type_id
WHERE scts.site_id = 'votre-id';
# Résultat: 4-5 types selon site_type
```

### 3. Tester les services

```typescript
// Test ContentTypeRegistry
import { getContentTypeForSite } from '@/lib/services/contentTypes/contentTypeRegistry';

const top10 = await getContentTypeForSite(siteId, 'top10');
console.log(top10.templateSchema);
console.log(top10.systemPrompt);

// Test PromptBuilder
import { buildPromptFromContentType } from '@/lib/services/contentTypes/promptBuilder';

const prompts = buildPromptFromContentType(top10, {
  title: "Top 10 des meilleurs frameworks",
  category: { name: "Tech", slug: "tech" },
  site: { name: "DevMag", language: "fr", country: "FR" }
});

console.log(prompts.systemPrompt); // Prompt complet
```

---

## 📋 Les 10 types de contenu

| Key | Label | Mots | H2 | Cas d'usage |
|-----|-------|------|----|----|
| `top10` | Top 10 | 1200+ | Exactly 10 | Listes/classements |
| `news` | Actualité | 400-800 | 2-4 | News courtes |
| `guide` | Guide | 1500+ | 4-8 | Guides complets |
| `howto` | How-To | 1000+ | 3-6 | Tutoriels |
| `review` | Test/Critique | 1200+ | 4-6 | Reviews produits |
| `comparison` | Comparatif | 1400+ | 5-7 | Comparaisons |
| `interview` | Interview | 1000+ | 3-6 | Interviews |
| `explainer` | Décryptage | 1300+ | 4-6 | Explainers |
| `opinion` | Opinion | 900+ | 3-5 | Éditos |
| `evergreen` | Article de fond | 2000+ | 6-10 | Long-form |

Chaque type inclut:
- ✅ Template structurel (JSON)
- ✅ 4 prompts IA (system, style, plan, format)
- ✅ Profil de validation (règles)
- ✅ Tags HTML autorisés
- ✅ Patterns interdits

---

## 🔧 Activation par défaut selon site_type

| Site Type | Types activés par défaut |
|-----------|--------------------------|
| `news_media` | news, explainer, interview, opinion |
| `gaming_popculture` | news, review, guide, top10 |
| `affiliate_guides` | guide, review, comparison, top10, howto |
| `lifestyle` | guide, top10, howto, opinion |
| `niche_passion` | news, guide, review, top10, howto |

Ces types sont auto-activés lors de l'application du blueprint.

---

## 🎨 Architecture du système

```
┌─────────────────────────────────────────┐
│  EDITORIAL CONTENT TYPES (Registry)     │
│  - 10 types standards                   │
│  - Templates + Prompts + Validation     │
│  - Global, immuable (sauf admin)        │
└─────────────────┬───────────────────────┘
                  │
                  │ references
                  │
┌─────────────────▼───────────────────────┐
│  SITE CONTENT TYPE SETTINGS             │
│  - Per-site activation                  │
│  - Per-site overrides (optionnel)       │
│  - Enable/Disable toggles               │
└─────────────────┬───────────────────────┘
                  │
                  │ uses
                  │
┌─────────────────▼───────────────────────┐
│  CONTENT (Articles)                     │
│  - content_type_id (UUID)               │
│  - References editorial_content_types   │
└─────────────────────────────────────────┘
```

**Flow de génération d'article:**
```
1. User sélectionne type → content_type_id
2. Load via ContentTypeRegistry → ResolvedContentType (with overrides)
3. PromptBuilder → Compose prompts complets
4. Call OpenAI avec prompts
5. Validator → Vérifie template_schema + validator_profile
6. Save article avec content_type_id
```

---

## ⚙️ Services disponibles

### ContentTypeRegistry

```typescript
// Charger un type pour un site (avec overrides)
getContentTypeForSite(siteId, key): Promise<ResolvedContentType>

// Charger tous les types activés
getEnabledContentTypes(siteId): Promise<ResolvedContentType[]>

// Charger par ID
getContentTypeById(siteId, id): Promise<ResolvedContentType>

// Lister tous (admin)
listAllContentTypes(): Promise<any[]>

// Stats
getContentTypeStats(siteId): Promise<Stats>
```

### PromptBuilder

```typescript
// Composer prompts complets
buildPromptFromContentType(
  contentType: ResolvedContentType,
  context: ArticleContext
): ComposedPrompts

// Helpers
getWordCountRequirement(contentType): {min, max, target}
getH2CountRequirement(contentType): {exact, min, max}
```

---

## 🧪 Tests recommandés

### Test 1: Migrations
```sql
-- Vérifier tables
SELECT tablename FROM pg_tables 
WHERE tablename IN ('editorial_content_types', 'site_content_type_settings');

-- Vérifier seed
SELECT COUNT(*) FROM editorial_content_types;
-- Résultat attendu: 10
```

### Test 2: Blueprint sans contentTypes
```typescript
// Créer site + générer blueprint
const blueprint = await generateBlueprint(siteId);
console.log('contentTypes' in blueprint); // false ✅
```

### Test 3: Site settings initialisés
```sql
SELECT COUNT(*) FROM site_content_type_settings 
WHERE site_id = 'test-site-id';
-- Résultat attendu: 4-5 (selon site_type)
```

### Test 4: Charger type avec overrides
```typescript
const resolved = await getContentTypeForSite(siteId, 'top10');
console.log(resolved.source); // 'canonical' ou 'overridden'
console.log(resolved.overrides); // [] ou ['systemPrompt', ...]
```

### Test 5: Composer prompts
```typescript
const prompts = buildPromptFromContentType(contentType, context);
console.log(prompts.systemPrompt.length > 500); // true ✅
console.log(prompts.userPrompt.includes(context.title)); // true ✅
```

---

## ⚠️ Ce qui ne fonctionne PAS encore

1. **Génération d'articles** (tâche #9)
   - Utilise encore ancien système
   - Doit être adapté pour nouveau prompt system
   - Doit stocker `content_type_id` au lieu de `content_type_key`

2. **Validation d'articles** (tâche #8)
   - Utilise encore anciennes règles
   - Doit être adapté pour `validator_profile` + `template_schema`

3. **Admin UI** (tâches #10-12)
   - Pas de UI pour éditer content types
   - Pas de UI pour gérer overrides par site

4. **Migration rétrocompat** (tâche #13)
   - Articles existants ont `content_type_key`
   - Doivent être migrés vers `content_type_id`

---

## 🛣️ Roadmap

### Court terme (à faire maintenant)
1. ✅ Appliquer migrations
2. ✅ Tester fondations
3. 🔄 Adapter validator (#8)
4. 🔄 Adapter article factory (#9)

### Moyen terme
5. Créer APIs admin (#10-11)
6. Créer UI admin (#12)
7. Tester génération d'articles

### Long terme
8. Migration rétrocompat (#13)
9. Déprécier ancienne table `content_types`
10. Versioning des content types (optionnel)

---

## 💡 Cas d'usage

### Ajouter un nouveau type de contenu

```sql
-- Via SQL (admin uniquement)
INSERT INTO editorial_content_types (
  key, label, description,
  template_schema, validator_profile,
  system_prompt, style_prompt,
  allowed_html_tags, forbidden_patterns
) VALUES (
  'quick_tip',
  'Conseil Rapide',
  'Conseil court et actionnable',
  '{"format":"html","blocks":[...]}',
  '{"min_words":300,"h2_count_min":2}',
  'You are writing a quick tip...',
  'Be concise and actionnable...',
  '["h2","p","ul","li"]',
  '["—"]'
);
```

### Activer un type pour un site

```sql
-- Activer 'quick_tip' pour un site
INSERT INTO site_content_type_settings (site_id, content_type_id, is_enabled)
VALUES (
  'site-uuid',
  (SELECT id FROM editorial_content_types WHERE key = 'quick_tip'),
  true
);
```

### Override un prompt pour un site

```sql
-- Override system_prompt pour un site spécifique
UPDATE site_content_type_settings
SET system_prompt_override = 'Custom prompt for this site...'
WHERE site_id = 'site-uuid'
AND content_type_id = (SELECT id FROM editorial_content_types WHERE key = 'top10');
```

---

## 🔗 Liens utiles

- **Status détaillé:** `CONTENT_TYPES_REFACTOR_STATUS.md`
- **Summary + tests:** `CONTENT_TYPES_REFACTOR_SUMMARY.md`
- **Migrations:** `MIGRATIONS_TO_APPLY.md`
- **Migration SQL:** `lib/db/migration-editorial-content-types.sql`
- **Seed SQL:** `lib/db/seed-editorial-content-types.sql`

---

## 🆘 Besoin d'aide ?

- Les migrations ne s'appliquent pas → Vérifier syntax SQL
- Blueprint génère encore contentTypes → Vérifier code generator
- site_content_type_settings vide → Vérifier apply engine
- Services ne trouvent pas les types → Vérifier seed appliqué

---

**Dernière mise à jour:** 2026-02-17  
**Version:** 1.0.0  
**Status:** Fondations complètes, prêt pour phase 2
