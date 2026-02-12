# Onboarding Progressif avec Enrichissement 1 Clic

## Vue d'ensemble

Système d'onboarding en **3 étapes** sur le dashboard qui guide l'utilisateur de la création à un site prêt à l'emploi.

## Architecture

### 1. Statuts de setup (enum étendu)

**Avant:** `'draft' | 'configured'`
**Après:** `'draft' | 'blueprint_applied' | 'enriched'`

**Transitions:**
```
draft → blueprint_applied → enriched
  ↓            ↓               ↓
Générer    Enrichir        Site prêt
```

### 2. Migration DB

**Nouveau fichier:** `lib/db/migration-sites-setup-status-enum.sql`

```sql
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS sites_setup_status_check;

ALTER TABLE sites
  ADD CONSTRAINT sites_setup_status_check 
  CHECK (setup_status IN ('draft', 'blueprint_applied', 'enriched'));
```

### 3. API Enrichment "1 Clic"

**Nouveau endpoint:** `POST /api/admin/sites/[id]/enrichment/run-all`

**Body:**
```json
{
  "mode": "fill_only_empty" | "overwrite"
}
```

**Flow:**
1. Appelle `buildCategoryEnrichmentProposals` + auto-apply
2. Appelle `buildAuthorEnrichmentProposals` + auto-apply
3. Appelle `buildPageEnrichmentProposals` + auto-apply
4. Si tous réussis → `UPDATE sites SET setup_status='enriched'`

**Retourne:**
```json
{
  "success": true,
  "results": {
    "categories": { "success": true, "jobId": "uuid", "error": null },
    "authors": { "success": true, "jobId": "uuid", "error": null },
    "pages": { "success": true, "jobId": "uuid", "error": null }
  }
}
```

### 4. UI Component - `EnrichmentOneClickButton.tsx`

**Features:**
- Bouton principal: "Lancer l'enrichissement complet"
- Loading state avec spinner et message
- Success state avec liens vers les 3 jobs IA
- Error state si échec partiel
- Auto-reload après 2 secondes si succès
- Bouton secondaire: "Enrichissement manuel"

### 5. Dashboard - 3 Cards selon status

#### Étape 1: `setup_status = 'draft'`

```
┌──────────────────────────────────────────────┐
│ 🚀  Étape 1 : Générer la structure       [IA]│
│                                                │
│ Générez automatiquement la structure...       │
│                                                │
│ [🤖 Générer avec l'IA] [Paramètres du site]  │
└──────────────────────────────────────────────┘
```

#### Étape 2: `setup_status = 'blueprint_applied'`

```
┌──────────────────────────────────────────────┐
│ ✨  Étape 2 : Enrichir le contenu    [1 clic]│
│                                                │
│ La structure est créée ! Maintenant, générez  │
│ automatiquement le contenu...                 │
│                                                │
│ [✨ Lancer l'enrichissement complet]          │
│ [Enrichissement manuel]                       │
└──────────────────────────────────────────────┘
```

#### Étape 3: `setup_status = 'enriched'`

```
┌──────────────────────────────────────────────┐
│ ✅  Site prêt à l'emploi !                    │
│                                                │
│ La structure et le contenu sont générés.      │
│ Votre site est prêt pour la publication.      │
│                                                │
│ [Créer un article IA] [Voir les jobs IA]     │
└──────────────────────────────────────────────┘
```

## Flow utilisateur complet

### Scénario idéal (1 clic × 2)

```
1. Créer site "Cuisine du Monde"
   ↓ setup_status = 'draft'
   
2. Dashboard → Card "Étape 1"
   ↓ Click "Générer avec l'IA"
   
3. Page /setup → Generate blueprint
   ↓ GPT-4o génère structure adaptée cuisine
   
4. Preview blueprint
   ↓ Categories: recettes, techniques, etc.
   
5. Click "Appliquer"
   ↓ Create categories/authors/pages/contentTypes
   ↓ setup_status = 'blueprint_applied'
   
6. Redirect to dashboard → Card "Étape 2"
   ↓ Click "Lancer l'enrichissement complet"
   
7. API: /enrichment/run-all
   ↓ Enrich categories (GPT-4o-mini)
   ↓ Enrich authors (GPT-4o-mini)
   ↓ Enrich pages (GPT-4o-mini)
   ↓ setup_status = 'enriched'
   
8. Dashboard reload → Card "Site prêt ✅"
   ↓ Site complet, prêt pour articles !
```

### Temps total estimé

- Génération blueprint: ~10-15s (GPT-4o)
- Application blueprint: ~2-5s (DB inserts)
- Enrichissement complet: ~30-60s (3 × GPT-4o-mini)
- **Total: ~45-80 secondes** pour un site complet !

## Gestion des erreurs

### Enrichissement partiel

Si une étape échoue (ex: categories OK, authors OK, pages FAIL):

```
⚠️ Enrichissement partiel

• Catégories: OK
• Auteurs: OK
• Pages: Validation failed (exemple)
```

Le `setup_status` reste `'blueprint_applied'` pour permettre de re-essayer.

### Pas de blueprint

Si user essaie d'enrichir sans blueprint:

```
❌ Erreur: Aucun blueprint actif. 
Générez d'abord un blueprint.
```

## Modifications des services

### `applyBlueprintTemplate.ts`

**Avant:** `setup_status = 'configured'`
**Après:** `setup_status = 'blueprint_applied'`

### Nouveaux services

**API route:** `app/api/admin/sites/[id]/enrichment/run-all/route.ts`
- Orchestrateur des 3 enrichissements
- Mode par défaut: `fill_only_empty`
- Logs 3 AI jobs distincts
- Update status final

**Component:** `app/admin/sites/[id]/EnrichmentOneClickButton.tsx`
- Client component avec state management
- Loading/Success/Error UI
- Auto-reload après succès
- Liens vers jobs IA individuels

## Avantages

✅ **Onboarding clair** - 3 étapes visuelles avec progression
✅ **1 clic par étape** - UX ultra-simplifiée
✅ **Feedback immédiat** - Loading states, success messages
✅ **Traçabilité** - Tous les jobs loggés dans `ai_job`
✅ **Idempotent** - Mode `fill_only_empty` par défaut (safe)
✅ **Flexible** - Lien vers enrichissement manuel si besoin
✅ **Rapide** - ~60 secondes pour un site complet

## Migrations SQL à exécuter

**Important:** Ajoute cette migration aux précédentes (section 9):

```sql
-- Expand setup_status enum
ALTER TABLE sites
  DROP CONSTRAINT IF EXISTS sites_setup_status_check;

ALTER TABLE sites
  ADD CONSTRAINT sites_setup_status_check 
  CHECK (setup_status IN ('draft', 'blueprint_applied', 'enriched'));

COMMENT ON COLUMN sites.setup_status IS 'Setup status: draft (initial), blueprint_applied (structure created), enriched (content enriched)';
```

Aussi dans `MIGRATIONS_TO_APPLY.md` section 9.

## Tests

### Test 1: Nouveau site (draft)
```
1. Créer site
2. Vérifier: setup_status='draft'
3. Dashboard: Card "Étape 1" visible
4. Click "Générer avec l'IA"
5. Apply blueprint
6. Vérifier: setup_status='blueprint_applied'
```

### Test 2: Blueprint appliqué
```
1. Site avec setup_status='blueprint_applied'
2. Dashboard: Card "Étape 2" visible
3. Click "Lancer l'enrichissement complet"
4. Attendre ~60s
5. Success: Links vers 3 jobs
6. Auto-reload
7. Vérifier: setup_status='enriched'
```

### Test 3: Site enrichi
```
1. Site avec setup_status='enriched'
2. Dashboard: Card "Site prêt ✅" visible
3. Boutons: "Créer un article IA", "Voir les jobs IA"
4. Plus de card onboarding (workflow terminé)
```

### Test 4: Enrichissement partiel
```
1. Un enrichissement échoue (ex: pages)
2. UI: Message "Enrichissement partiel"
3. Détails des erreurs affichés
4. setup_status reste 'blueprint_applied'
5. User peut re-essayer
```

## Fichiers créés/modifiés

### Nouveaux:
- `lib/db/migration-sites-setup-status-enum.sql`
- `app/api/admin/sites/[id]/enrichment/run-all/route.ts`
- `app/admin/sites/[id]/EnrichmentOneClickButton.tsx`

### Modifiés:
- `lib/db/types.ts` (SetupStatus type)
- `lib/services/setup/applyBlueprintTemplate.ts` (status change)
- `app/admin/sites/[id]/page.tsx` (3 cards conditionnelles)
- `MIGRATIONS_TO_APPLY.md` (section 9)

## Prochaines améliorations (optionnel)

1. **Progress bar**: Afficher progression real-time (Categories 1/3...)
2. **Notifications**: Toast notifications pendant enrichissement
3. **Rollback**: Si échec, proposer de reset et recommencer
4. **Logs détaillés**: Page dédiée `/setup/progress` avec logs live
5. **Skip step**: Permettre de passer directement à enriched sans enrichir
