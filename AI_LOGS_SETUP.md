# FOUNDRY – AI Logs v1 (persist + UI)

## Objectif
Système de logs pour suivre les générations d'articles par IA, avec UI admin complète pour debugging et monitoring.

---

## 1. Data Model

### Tables

#### `ai_job` (mise à jour)
- ✅ `id` (uuid, pk)
- ✅ `site_id` (uuid, indexed)
- ✅ `kind` (varchar) - "article_generate"
- ✅ `status` (varchar) - "pending" | "running" | "done" | "error"
- ✅ `error_code` (varchar) - VALIDATION_FAILED, OPENAI_ERROR, DB_INSERT_ERROR
- ✅ `error_message` (text)
- ✅ `retries` (int)
- ✅ `model_used` (varchar)
- ✅ `tokens_used` (int, nullable)
- ✅ `input_json` (jsonb) - contexte de génération
- ✅ `output_json` (jsonb) - résultats + tentatives
- ✅ `started_at` (timestamp)
- ✅ `finished_at` (timestamp)
- ✅ `created_at`, `updated_at`

**Indexes:**
- (site_id, created_at desc)
- (site_id, status)

#### `content` (ajout)
- ✅ `ai_job_id` (uuid, nullable) - FK vers `ai_job`

---

## 2. Logging Contract

### Input JSON (contexte stocké au démarrage)
```json
{
  "idea_id": "uuid",
  "title": "Titre de l'idée",
  "angle": "Angle si fourni",
  "content_type_key": "news",
  "category_slug": "tech",
  "category_name": "Technologie",
  "author_id": "uuid",
  "author_name": "John Doe",
  "site": {
    "name": "Mon Site",
    "language": "fr",
    "country": "FR"
  },
  "contentType": {
    "key": "news",
    "label": "Actualités"
  }
}
```

### Output JSON (résultat de génération)
```json
{
  "summary": {
    "articleId": "uuid",
    "articleSlug": "mon-article",
    "articleTitle": "Titre final",
    "stats": {
      "wordCount": 1250,
      "h2Count": 5,
      "listCount": 1
    },
    "validationErrors": []
  },
  "attempts": [
    {
      "attemptNumber": 1,
      "model": "gpt-4o-mini",
      "validation": {
        "valid": false,
        "errors": [
          {
            "code": "WORD_COUNT_TOO_LOW",
            "message": "L'article doit contenir au moins 1200 mots"
          }
        ],
        "stats": {
          "wordCount": 1050,
          "h2Count": 4,
          "listCount": 1,
          "paragraphsPerH2": [2, 2, 3, 2]
        }
      },
      "createdAt": "2026-02-10T14:23:45.123Z"
    },
    {
      "attemptNumber": 2,
      "model": "gpt-4o-mini",
      "validation": {
        "valid": true,
        "errors": [],
        "stats": {
          "wordCount": 1250,
          "h2Count": 5,
          "listCount": 1,
          "paragraphsPerH2": [2, 3, 2, 3, 2]
        }
      },
      "createdAt": "2026-02-10T14:24:12.456Z"
    }
  ]
}
```

---

## 3. Pipeline Updates

### `generateArticleFromIdea.ts`
- ✅ Logs chaque tentative dans un tableau `attempts[]`
- ✅ Retourne les tentatives avec les stats de validation
- ✅ Stocke les erreurs de validation pour chaque retry

### `app/api/admin/sites/[id]/articles/generate/route.ts`
- ✅ Crée `ai_job` avec status="running" + `started_at`
- ✅ Stocke le contexte complet dans `input_json`
- ✅ Sur succès:
  - Status="done"
  - `finished_at` = now
  - `output_json.summary` avec articleId + stats
  - `output_json.attempts` = toutes les tentatives
- ✅ Sur erreur:
  - Status="error"
  - `error_code` + `error_message`
  - `finished_at` = now
- ✅ Lie l'article créé au job: `content.ai_job_id = ai_job.id`

---

## 4. Admin UI

### Routes créées

#### `/admin/sites/[id]/ai-jobs`
**Liste des jobs IA**
- Table triée par date (plus récent en haut)
- Filtres: status (all/done/error/running)
- Colonnes:
  - Titre (de l'idée)
  - Type de contenu
  - Status (badge coloré)
  - Nombre de retries
  - Date de fin
  - Code erreur (si erreur)
  - Actions (Détails + Voir article si créé)

#### `/admin/sites/[id]/ai-jobs/[jobId]`
**Détails d'un job**
- Header: status + retries + timestamps
- Card "Article créé" avec lien (si succès)
- Panel "Erreur" (si status=error)
- Panel "Input" (contexte JSON, collapsible)
- Panel "Tentatives" détaillées:
  - Pour chaque tentative: validation valid/invalid
  - Stats (mots, H2, listes)
  - Erreurs de validation avec codes
- Panel "Output complet" (JSON brut, collapsible)

#### Intégration dans l'éditeur d'article
**`/admin/sites/[id]/content/[contentId]`**
- ✅ Badge "Généré par IA" si `ai_job_id` existe
- ✅ Affiche la date de génération + nombre de retries
- ✅ Lien vers les détails du job

#### Lien dans le dashboard
**`/admin/sites/[id]`**
- ✅ Bouton "Jobs IA" dans les actions rapides

---

## 5. API Endpoints

### GET `/api/admin/sites/[id]/ai-jobs`
**Liste des jobs pour un site**
- Query params:
  - `status` (all/done/error/running)
  - `kind` (article_generate par défaut)
- Returns: `{ jobs: AIJob[] }`
- Limite: 50 derniers jobs

### GET `/api/admin/sites/[id]/ai-jobs/[jobId]`
**Détails d'un job**
- Returns: `{ job: AIJob }`
- Vérifie que le job appartient au site

---

## 6. Tests

### `lib/services/ai/generateArticleFromIdea.test.ts`
- ✅ Génération réussie au premier essai + log de tentative
- ✅ Retry sur échec de validation + log de toutes les tentatives
- ✅ Erreurs de validation loggées dans attempts

---

## 7. Migrations SQL

### Fichiers créés
1. ✅ `lib/db/migration-ai-job.sql` (mise à jour avec nouveaux champs)
2. ✅ `lib/db/migration-ai-job-link-article.sql` (ajout ai_job_id à content)

### Application des migrations
```bash
# Appliquer la mise à jour de ai_job
psql -U [user] -d [database] -f lib/db/migration-ai-job.sql

# Ajouter le lien article -> ai_job
psql -U [user] -d [database] -f lib/db/migration-ai-job-link-article.sql
```

---

## 8. Usage

### Générer un article IA
1. Aller sur `/admin/sites/[id]/articles/new-ai`
2. Remplir le formulaire
3. Cliquer "Générer un brouillon"
4. Un `ai_job` est créé avec status="running"

### Voir les logs
1. Aller sur `/admin/sites/[id]/ai-jobs`
2. Filtrer par status si nécessaire
3. Cliquer sur "Détails" pour voir:
   - Toutes les tentatives
   - Erreurs de validation
   - Contexte complet

### Debugging en cas d'erreur
1. Ouvrir `/admin/sites/[id]/ai-jobs`
2. Trouver le job avec status="error"
3. Regarder:
   - `error_code` (type d'erreur)
   - `error_message` (détails)
   - Panel "Tentatives" (validation errors)
   - Input JSON (contexte fourni)

---

## 9. Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_FAILED` | L'article n'a pas passé la validation après max retries |
| `OPENAI_ERROR` | Erreur de l'API OpenAI |
| `DB_INSERT_ERROR` | Erreur lors de la création de l'article en DB |
| `UNKNOWN_ERROR` | Erreur non catégorisée |

---

## 10. Prochaines étapes possibles

- [ ] Ajout de tokens_used (tracking conso OpenAI)
- [ ] Export CSV des jobs pour analytics
- [ ] Notification Slack/Email sur erreur
- [ ] Dashboard analytics (taux de succès, moyenne de retries, etc.)
- [ ] Possibilité de "rejouer" un job failed

---

**Status: ✅ IMPLÉMENTÉ**
**Date: 2026-02-10**
