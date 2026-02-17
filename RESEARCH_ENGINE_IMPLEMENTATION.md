# Research Engine - Phase 1 COMPLETE ✅

**Date:** 2026-02-12  
**Statut:** ✅ PHASE 1 TERMINÉE

---

## 🎯 Objectif atteint

Foundry dispose maintenant d'un **moteur de recherche universel** qui :
- ✅ Appelle Perplexity pour générer des briefs de recherche
- ✅ Parse et valide la qualité des recherches (gating)
- ✅ Réessaie intelligemment en cas d'échec
- ✅ S'intègre automatiquement dans la génération d'articles
- ✅ Est totalement configurable par type de contenu
- ✅ Stocke tout pour audit et debug

---

## 📊 Architecture implémentée

```
┌─────────────────────────────────────────┐
│   User: Generate Article                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   1. RESEARCH PHASE (if required)       │
│   ├─ Load content_type config           │
│   ├─ Build prompt from template         │
│   ├─ Call Perplexity API                │
│   ├─ Extract structure (extractor)      │
│   ├─ Validate quality (gating)          │
│   └─ Retry if needed                    │
│   → research_pack_id                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   2. GPT WRITING PHASE                  │
│   ├─ Inject research brief              │
│   ├─ Generate article HTML              │
│   ├─ Validate structure                 │
│   └─ Link to research_pack_id           │
└─────────────────────────────────────────┘
```

---

## 📁 Fichiers créés (13 nouveaux)

### Database (3)
1. `lib/db/migration-research-engine.sql` - Tables + colonnes
2. `lib/db/seed-research-config.sql` - Config pour 10 types
3. `check-specific-job.sql` - Debug helper

### Research Services (7)
4. `lib/services/research/perplexityClient.ts` - Client API
5. `lib/services/research/orchestrator.ts` - Orchestrateur principal
6. `lib/services/research/extractors/types.ts` - Type definitions
7. `lib/services/research/extractors/articleMd.ts` - Extractor markdown
8. `lib/services/research/extractors/index.ts` - Registry
9. `lib/services/research/gating/runGating.ts` - Validation dynamique

### Integration (2)
10. `lib/services/ai/generateArticleFromIdea.v2.ts` - **MODIFIÉ** (research intégré)
11. `app/api/admin/sites/[id]/articles/generate/route.ts` - **MODIFIÉ** (research_pack_id)

### Documentation (2)
12. `RESEARCH_ENGINE_IMPLEMENTATION.md` - Ce fichier
13. `CONTENT_TYPES_SIMPLIFIED.md` - **MODIFIÉ**

---

## 🗄️ Structure de la DB

### Table: `research_packs`
Stocke le résultat final validé d'une recherche.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK |
| `site_id` | uuid | FK sites |
| `content_type_id` | uuid | FK editorial_content_types |
| `topic` | text | Sujet de recherche |
| `angle` | text | Angle optionnel |
| `status` | text | partial/completed/failed |
| `attempts_count` | int | Nombre de tentatives |
| `final_brief_markdown` | text | Brief validé (markdown) |
| `final_sources` | jsonb | URLs des sources |

### Table: `research_attempts`
Stocke **chaque tentative** pour audit.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK |
| `research_pack_id` | uuid | FK research_packs |
| `attempt_no` | int | Numéro de tentative |
| `prompt` | text | Prompt envoyé |
| `raw_response` | text | Réponse brute Perplexity |
| `extracted_sources` | jsonb | URLs extraites |
| `parsed_payload` | jsonb | Structure parsée |
| `gating_report` | jsonb | Résultat validation |
| `passed_gating` | boolean | Pass/Fail |

### Colonnes ajoutées: `editorial_content_types`

| Colonne | Type | Description |
|---------|------|-------------|
| `research_prompt_template` | text | Template avec {{topic}}, {{angle}} |
| `research_extractor_key` | text | article_md, list_md, etc. |
| `research_gating_rules` | jsonb | Règles de validation |
| `research_max_attempts` | int | Max retries (default: 3) |
| `research_required` | boolean | Obligatoire ? |

### Colonne ajoutée: `content`

| Colonne | Type | Description |
|---------|------|-------------|
| `research_pack_id` | uuid | FK research_packs (nullable) |

---

## ⚙️ Configuration par Content Type

Tous les 10 types ont été configurés avec :

| Type | research_required | min_sources | Règles spéciales |
|------|-------------------|-------------|------------------|
| **top10** | ✅ true | 5 | require_official_source, min_items: 10 |
| **news** | ✅ true | 3 | require_official_source, must_have_date |
| **guide** | ✅ true | 4 | min_sections: 5 |
| **howto** | ✅ true | 3 | min_sections: 4 |
| **review** | ✅ true | 4 | require_official_source, must_have_pricing |
| **comparison** | ✅ true | 5 | require_official_source, must_have_pricing, min_items: 3 |
| **interview** | ❌ false | 3 | - |
| **explainer** | ✅ true | 4 | must_have_stats, min_sections: 4 |
| **opinion** | ❌ false | 3 | - |
| **evergreen** | ✅ true | 4 | min_sections: 5 |

---

## 🔄 Flow de génération d'article

### Avec Research (research_required = true)

1. User clique "Générer un brouillon"
2. **PHASE RESEARCH**
   - Orchestrator crée un `research_pack`
   - Appelle Perplexity avec le prompt template
   - Parse la réponse (extractor)
   - Valide la qualité (gating)
   - Retry si échec (max 3 fois)
   - Sauvegarde le brief validé
3. **PHASE WRITING**
   - GPT reçoit le research brief
   - Génère l'article en s'appuyant sur les faits
   - Valide la structure
   - Sauvegarde avec `research_pack_id`

### Sans Research (research_required = false)

1. User clique "Générer un brouillon"
2. **PHASE WRITING** directement
   - GPT génère l'article sans brief
   - Valide la structure
   - Sauvegarde sans `research_pack_id`

---

## 🧪 Comment tester

### Test 1: Génération avec Research (Top 10)

```bash
1. Assurez-vous que PERPLEXITY_API_KEY est dans .env
2. Allez sur /admin/sites/[id]/articles/new-ai
3. Choisissez "Top 10" comme type
4. Titre: "Les 10 meilleurs smartphones de 2026"
5. Cliquez "Générer"
```

**Logs attendus:**
```
🔬 [RESEARCH ORCHESTRATOR] Starting research...
   Topic: Les 10 meilleurs smartphones de 2026
   Content Type: Top 10 (top10)
   Extractor: article_md
   Max Attempts: 3
   
   ✓ Research Pack created: xxx-xxx-xxx
   
   📡 Attempt 1/3
   ✓ Perplexity responded (3500ms, 1250 tokens)
   ✓ Citations: 8
   ✓ Extracted: 5 sections, 10 items, 8 sources
   ✅ Gating: PASS
   
   ✅ Research COMPLETED
   
[GENERATE V2] ✅ Research completed
[GENERATE V2] Prompts composed (hasResearchBrief: true)
```

### Test 2: Génération sans Research (Opinion)

```bash
1. Choisissez "Opinion" comme type
2. Générez un article
```

**Logs attendus:**
```
[GENERATE V2] Research phase skipped (not required for this content type)
[GENERATE V2] Prompts composed (hasResearchBrief: false)
```

### Test 3: Vérifier en DB

```sql
-- Voir tous les research packs
SELECT 
  rp.id,
  rp.topic,
  rp.status,
  rp.attempts_count,
  ect.label as content_type,
  LENGTH(rp.final_brief_markdown) as brief_length,
  jsonb_array_length(rp.final_sources) as sources_count
FROM research_packs rp
JOIN editorial_content_types ect ON ect.id = rp.content_type_id
ORDER BY rp.created_at DESC;

-- Voir les attempts d'un pack
SELECT 
  attempt_no,
  passed_gating,
  tokens_used,
  duration_ms,
  gating_report->>'pass' as gating_pass,
  jsonb_array_length(extracted_sources) as sources_count
FROM research_attempts
WHERE research_pack_id = 'YOUR_PACK_ID'
ORDER BY attempt_no;
```

---

## 🎨 Gating Rules - Exemples

### Top 10 (strict)
```json
{
  "min_sources": 5,
  "require_official_source": true,
  "min_items": 10,
  "min_content_length": 1000
}
```

### News (dates requises)
```json
{
  "min_sources": 3,
  "require_official_source": true,
  "must_have_date": true,
  "min_content_length": 400
}
```

### Review (prix requis)
```json
{
  "min_sources": 4,
  "require_official_source": true,
  "must_have_pricing": true,
  "min_content_length": 1000
}
```

---

## 🔧 Extensibilité

### Ajouter un nouvel extractor

```typescript
// lib/services/research/extractors/listMd.ts
export const listMdExtractor: ResearchExtractor = {
  key: 'list_md',
  label: 'List Markdown',
  extract(rawMarkdown, urls) {
    // Custom logic for lists
    return parsedPayload;
  },
};

// Register in index.ts
import { listMdExtractor } from './listMd';
const extractors = {
  article_md: articleMdExtractor,
  list_md: listMdExtractor, // ← NEW
};
```

Puis dans la config du content type :
```sql
UPDATE editorial_content_types
SET research_extractor_key = 'list_md'
WHERE key = 'top10';
```

### Ajouter une nouvelle gating rule

Les rules sont dynamiques. Ajoutez simplement dans `research_gating_rules` :

```json
{
  "min_sources": 5,
  "must_have_video_links": true,  ← Nouvelle règle custom
  "custom_validator": "check_video_presence"
}
```

Puis ajoutez la logique dans `runGating.ts`.

---

## 📈 Métriques disponibles

Chaque `research_attempt` contient :

```json
{
  "parsed_payload": {
    "sections": 8,
    "items": [{"title": "...", "content": "..."}],
    "hasDate": true,
    "hasPricing": false,
    "hasStats": true,
    "officialSources": ["https://..."],
    "allSources": ["https://...", "https://..."],
    "contentLength": 2450
  },
  "gating_report": {
    "pass": true,
    "reasons": [],
    "metrics": {
      "sourcesCount": 8,
      "officialSourcesCount": 3,
      "sectionsCount": 8,
      "itemsCount": 10,
      "contentLength": 2450,
      "hasDate": true,
      "hasPricing": false,
      "hasStats": true
    }
  }
}
```

---

## 🚀 Next Steps (Future Phases)

### Phase 2: Advanced Features
- [ ] UI Admin pour voir research packs
- [ ] Bouton "Force retry research"
- [ ] Extractors spécialisés (listMd, reviewMd)
- [ ] Gating rules avancées (duplicate detection)
- [ ] AI Job distinct pour research vs writing

### Phase 3: Optimization
- [ ] Cache des research packs (même topic)
- [ ] Parallel research pour batch generation
- [ ] Research quality scoring
- [ ] Cost tracking per research

---

## 📝 Variables d'environnement

Ajoutez dans `.env` :

```bash
# Perplexity API (for research phase)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxx

# Optional: Configure model
PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online
```

---

## 🎓 Exemples de prompts

### Top 10 (avec angle)
```
Topic: "Meilleurs smartphones 2026"
Angle: "Focus gaming et autonomie"

Prompt généré:
"Research and provide a comprehensive brief for a Top 10 article about: 
Meilleurs smartphones 2026 Focus gaming et autonomie

Please provide:
- A ranked list of exactly 10 items with titles
- For each item: key facts, specifications, pros/cons, pricing
..."
```

### News
```
Topic: "Sortie de la PlayStation 6"
Angle: null

Prompt généré:
"Research and provide factual information for a news article about:
Sortie de la PlayStation 6

Please provide:
- Confirmed facts and official statements
- Exact dates and timeline
..."
```

---

## ✅ Checklist Phase 1

- [x] Tables `research_packs` et `research_attempts`
- [x] Colonnes research dans `editorial_content_types`
- [x] Colonne `research_pack_id` dans `content`
- [x] Client Perplexity API
- [x] Orchestrator générique
- [x] Extractor `article_md`
- [x] Gating Engine dynamique
- [x] Retry strategy générique
- [x] Intégration dans `generateArticleV2`
- [x] Config seedée pour 10 types
- [x] Logs complets pour debug

---

## 🎉 Résultat

**Foundry est maintenant un véritable moteur éditorial orchestré !**

Perplexity → Recherche factuelle  
Gating Engine → Contrôle qualité  
GPT → Écriture structurée  
Validator → Conformité éditoriale  

Architecture universelle, scalable, configurable. 🚀
