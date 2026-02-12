# FOUNDRY – IA Enrichment v1.1: Categories + Authors COMPLETE

Système de génération IA de contenu professionnel pour catégories et auteurs avec preview/apply sécurisé.

---

## Objectif

Générer du contenu réel, de qualité éditoriale pour :
- **Catégories** : Description longue (visible) + SEO meta
- **Auteurs** : Biographie + tagline

**Caractéristiques clés:**
- Preview avant application
- Mode "fill_only_empty" (sûr par défaut)
- Logging complet dans `ai_job`
- Pas d'emojis, pas de long dash (—)
- Français pour sites FR

---

## 1. Architecture

### Services

#### `lib/services/ai/enrichCategoriesComplete.ts`

**Functions:**
- `buildCategoryEnrichmentProposals(input)` - Génère les propositions via OpenAI
  - Crée `ai_job` kind="enrich_categories"
  - Appelle GPT-4o-mini avec prompts structurés
  - Valide le JSON de sortie
  - Retourne proposals + aiJobId

- `applyCategoryEnrichment(siteId, aiJobId, selectedProposals, mode)` - Applique les propositions
  - Mode `fill_only_empty` : Ne touche que les champs vides
  - Mode `overwrite` : Remplace tout
  - Update `term.description` + upsert `seo_meta`
  - Log appliedIds dans `ai_job`

**Validation stricte:**
```typescript
- seo_description: <= 165 chars
- long_description_html: 150-450 mots, <p> tags only
- NO emojis (regex check)
- NO long dash —
```

#### `lib/services/ai/enrichAuthorsComplete.ts`

**Functions:**
- `buildAuthorEnrichmentProposals(input)` - Génère bios d'auteurs
  - Crée `ai_job` kind="enrich_authors"
  - Génère tagline (60-90 chars) + bio_html (120-200 mots)
  - Prend en compte role_key + specialties

- `applyAuthorEnrichment(siteId, aiJobId, selectedProposals, mode)` - Applique les bios
  - Update `authors.bio`
  - Respect fill_only_empty mode

---

## 2. Output Structure

### Catégories

Pour CHAQUE catégorie :

```json
{
  "term_id": "uuid",
  "slug": "tech",
  "seo_title": "Technologie | MonSite.fr",
  "seo_description": "Toute l'actualité tech : annonces, analyses, tendances. (150-160 chars)",
  "long_description_html": "<p>Paragraph 1...</p><p>Paragraph 2...</p><p>Paragraph 3...</p>"
}
```

**Champs mis à jour:**
- `terms.description` ← `long_description_html`
- `seo_meta.seo_title` ← `seo_title`
- `seo_meta.seo_description` ← `seo_description`
- `seo_meta.seo_og_description` ← `seo_description`

### Auteurs

Pour CHAQUE auteur :

```json
{
  "author_id": "uuid",
  "displayName": "Expert Anime & Manga",
  "roleKey": "expert_anime_manga",
  "tagline": "Décryptages et recommandations autour de l'animation et du manga japonais.",
  "bio_html": "<p>Paragraph 1...</p><p>Paragraph 2...</p><p>Paragraph 3...</p>"
}
```

**Champs mis à jour:**
- `authors.bio` ← `bio_html`

---

## 3. API Endpoints

### POST `/api/admin/sites/[id]/enhance/categories`
**Génère les propositions pour catégories**

Body:
```json
{
  "categoryIds": ["uuid1", "uuid2"],  // Optional, all if empty
  "mode": "fill_only_empty"           // or "overwrite"
}
```

Response:
```json
{
  "proposals": [...],
  "aiJobId": "uuid"
}
```

### POST `/api/admin/sites/[id]/enhance/categories/apply`
**Applique les propositions sélectionnées**

Body:
```json
{
  "aiJobId": "uuid",
  "selectedProposals": [...],
  "mode": "fill_only_empty"
}
```

Response:
```json
{
  "success": true,
  "appliedCount": 5,
  "skippedCount": 0
}
```

### POST `/api/admin/sites/[id]/enhance/authors`
**Génère les propositions pour auteurs**

(Même structure que categories)

### POST `/api/admin/sites/[id]/enhance/authors/apply`
**Applique les propositions d'auteurs**

(Même structure que categories/apply)

---

## 4. UI - Page Enhance

### Route: `/admin/sites/[id]/enhance`

**Structure:**
- 2 Tabs : **Catégories** | **Auteurs**
- Mode toggle : fill_only_empty (default, safe) | overwrite (⚠️)
- Bouton "Prévisualiser" → Génère les propositions
- Liste des proposals avec checkboxes
- Preview : Current vs Proposed (side-by-side)
- Bouton "Appliquer (N)" → Applique les sélectionnés
- Toast + lien vers ai_job details

**Composants:**
- `page.tsx` - Layout avec tabs
- `CategoriesEnhanceTab.tsx` - Tab catégories avec preview/apply
- `AuthorsEnhanceTab.tsx` - Tab auteurs avec preview/apply

**Features:**
- Select all / Deselect all
- Individual checkbox per proposal
- Visual diff (current en gris, proposed en bleu)
- HTML rendering pour les descriptions
- Error handling + success messages
- Link vers ai_job pour debugging

---

## 5. Prompts Engineering

### Categories System Prompt

```
You are a professional SEO content writer specializing in {site_type} websites.

OUTPUT REQUIREMENTS:
1. JSON only: { "categories": [...] }
2. SEO description: 150-160 chars, natural, NO emojis, NO long dash
3. Long description HTML: 200-400 words, 2-4 <p> tags, professional
4. SEO title: "{Category} | {SiteName}" (45-65 chars)
5. Language: {fr/en based on site}

NO generic conclusions. Be specific and informative.
```

### Authors System Prompt

```
You are a professional content writer creating author biographies.

OUTPUT REQUIREMENTS:
1. JSON only: { "authors": [...] }
2. Tagline: 60-90 chars, single sentence, professional
3. Bio HTML: 120-200 words, 2-3 <p> tags, credible tone
4. NO real identities or social links (generic)
5. NO grandiose claims ("passionné", "dédié" clichés)

Reflect role_key and specialties. Be credible and specific.
```

---

## 6. AI Job Logging

Tous les enrichissements sont loggés dans `ai_job` :

### Input JSON

```json
{
  "siteId": "uuid",
  "siteName": "MonSite.fr",
  "siteDescription": "...",
  "siteType": "niche_passion",
  "language": "fr",
  "categoryCount": 5,
  "categoryNames": ["Tech", "Gaming", ...],
  "mode": "fill_only_empty"
}
```

### Output JSON

```json
{
  "proposals": [
    {
      "term_id": "uuid",
      "slug": "tech",
      "seo_title": "...",
      "seo_description": "..."
    }
  ],
  "appliedIds": ["uuid1", "uuid2", ...],
  "rawResponse": { ... }
}
```

**Status tracking:**
- `running` → API call in progress
- `done` → Success
- `error` → Failed (with error_code + error_message)

---

## 7. Safety Features

### Mode: fill_only_empty (DEFAULT)

**Comportement:**
- Si `term.description` déjà rempli → SKIP
- Si `seo_meta.seo_title` déjà rempli → SKIP
- Si `seo_meta.seo_description` déjà rempli → SKIP

**Résultat:** Zero risk d'écrasement de contenu manuel.

### Mode: overwrite

**Comportement:**
- Remplace TOUT, même les champs déjà remplis
- ⚠️ Warning visible dans l'UI

**Utilisation:** Regénération complète d'un contenu insatisfaisant.

---

## 8. Tests

### `enrichCategoriesComplete.test.ts`

**Scénarios:**
- ✅ Validation passes pour contenu valide
- ✅ Rejette SEO description > 165 chars
- ✅ Rejette emojis
- ✅ Rejette long dash —
- ✅ Rejette HTML sans <p> tags
- ✅ Rejette word count hors limites

---

## 9. Workflow Utilisateur

### Enrichir les Catégories

1. **Générer les catégories** via Setup → Taxonomy Generator
2. **Aller sur** `/admin/sites/[id]/enhance`
3. **Tab "Catégories"**
4. **Sélectionner mode** : "Remplir uniquement vide"
5. **Cliquer** "Prévisualiser"
6. **Attendre** ~10-30 secondes (génération OpenAI)
7. **Review** les propositions (side-by-side)
8. **Décocher** celles qui ne conviennent pas (optionnel)
9. **Cliquer** "Appliquer (N)"
10. ✅ **Success** + lien vers ai_job

### Enrichir les Auteurs

Même workflow, tab "Auteurs".

---

## 10. Debugging

### Job échoué ?

1. Aller sur `/admin/sites/[id]/ai-jobs`
2. Trouver le job `enrich_categories` ou `enrich_authors` avec status="error"
3. Cliquer "Détails"
4. Regarder:
   - `error_code` (GENERATION_FAILED, etc.)
   - `error_message` (détails)
   - `input_json` (ce qui a été envoyé)

### Validation échouée ?

Erreurs typiques :
- SEO description trop longue
- Emojis détectés
- Long dash détecté
- HTML sans <p> tags
- Word count hors limites

**Solution :** Le service retry une fois automatiquement avec feedback d'erreur.

---

## 11. Limites & Améliorations futures

**Limites v1.1:**
- Pas de support pour `tagline` (auteurs) dans la base (peut être ajouté)
- Pas de bulk editing (une opération = toutes les catégories d'un coup)
- Pas de versioning du contenu généré

**Prochaines versions:**
- [ ] Historique des générations
- [ ] Comparaison side-by-side avec versions précédentes
- [ ] Export/Import de proposals
- [ ] Templates de prompts customisables
- [ ] Support multilingue avancé

---

**Status: ✅ IMPLÉMENTÉ**  
**Version: 1.1**  
**Date: 2026-02-10**
