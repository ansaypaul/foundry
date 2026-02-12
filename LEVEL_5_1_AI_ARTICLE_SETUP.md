# FOUNDRY – Level 5.1: AI Article Generation Setup

## Résumé

Cette fonctionnalité permet de générer des articles complets avec l'IA en fournissant simplement un sujet/titre et un angle optionnel. L'article généré :
- Respecte strictement les règles du type de contenu (`rules_json`)
- Utilise uniquement les balises HTML autorisées
- Passe automatiquement la validation (`articleValidator`)
- Est créé en brouillon (pas de publication automatique)

---

## 1. Configuration initiale

### A) Exécuter les migrations SQL

Les nouvelles tables nécessaires doivent être créées dans la base de données :

```bash
# Dans Supabase SQL Editor ou psql
psql -h your-host -U your-user -d your-db < lib/db/migration-content-idea.sql
psql -h your-host -U your-user -d your-db < lib/db/migration-ai-job.sql
```

**Tables créées :**
- `content_idea` : Stocke les idées d'articles avant génération
- `ai_job` : Suit l'état des tâches IA (génération, erreurs, retries)

### B) Configurer OpenAI API Key

1. Obtenir une clé API OpenAI :
   - Créer un compte sur https://platform.openai.com/
   - Aller dans "API Keys"
   - Créer une nouvelle clé secrète
   - Copier la clé (elle ne sera affichée qu'une fois)

2. Ajouter la clé dans `.env` :

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Redémarrer le serveur Next.js :

```bash
npm run dev
```

**Important :** Ne JAMAIS committer le fichier `.env` avec la vraie clé API.

---

## 2. Utilisation

### A) Via l'interface

1. Aller sur le tableau de bord du site (`/admin/sites/[id]`)
2. Cliquer sur le bouton "Article IA" (avec l'icône 🤖)
3. Remplir le formulaire :
   - **Sujet/Titre** : Le thème principal (requis)
   - **Angle** : Perspective ou focus particulier (optionnel)
   - **Type de contenu** : Sélectionner parmi les types configurés (news, review, etc.)
   - **Catégorie** : Choisir la catégorie appropriée
4. Cliquer sur "Générer un brouillon"
5. Attendre la génération (quelques secondes)
6. Vous êtes redirigé vers la page d'édition de l'article généré

### B) Workflow complet

```
Idée → Génération IA → Validation → Brouillon créé → Édition manuelle → Publication
```

**Étapes internes :**
1. Création d'un enregistrement `content_idea` (status: processing)
2. Création d'un `ai_job` (status: running)
3. Appel à OpenAI avec les contraintes du type de contenu
4. Validation du HTML généré avec `articleValidator`
5. Si invalide : retry automatique (max 2 fois) avec correction
6. Si valide : création de l'article en brouillon
7. Mise à jour des statuts (ai_job: done, content_idea: done)

---

## 3. Sélection d'auteur

L'auteur est choisi automatiquement selon cette logique déterministe :

1. Si le type de contenu définit `preferred_author_role_keys`, sélectionner le premier auteur actif avec ce rôle
2. Sinon, sélectionner un auteur avec le rôle `editorial_lead`
3. En dernier recours, sélectionner n'importe quel auteur actif

Exemple dans `rules_json` :

```json
{
  "defaults": {
    "preferred_author_role_keys": ["tech_writer", "reviewer"]
  }
}
```

---

## 4. Validation et retry

### A) Contraintes appliquées

Le prompt système inclut TOUTES les contraintes du `rules_json` :
- Balises HTML autorisées uniquement
- Nombre minimum de mots
- Nombre de sections H2
- Paragraphes minimum par H2
- Nombre maximum de listes
- Éléments minimum par liste
- Interdictions : emojis, tirets longs (—), conclusions génériques

### B) Boucle de validation

```
Tentative 1 → Validation ❌
              ↓
          Retry 1 (avec erreurs) → Validation ❌
              ↓
          Retry 2 (avec erreurs) → Validation ✅
              ↓
          Article créé en brouillon
```

**Max retries :** 2 (3 tentatives au total)

Si toutes les tentatives échouent, l'erreur est enregistrée dans `ai_job.error_message` et affichée à l'utilisateur.

---

## 5. Modèle utilisé

**Par défaut :** `gpt-4o-mini`

Ce modèle offre :
- Coût réduit (~150x moins cher que GPT-4)
- Vitesse rapide (2-5 secondes par article)
- Qualité suffisante pour du contenu structuré

**Paramètres :**
- `temperature: 0.7` (créativité modérée)
- `max_tokens: 4000` (articles jusqu'à ~3000 mots)
- `response_format: json_object` (parsing fiable)

Pour changer de modèle, modifier dans `lib/services/ai/generateArticleFromIdea.ts` :

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o', // ou 'gpt-4-turbo', etc.
  // ...
});
```

---

## 6. Sécurité et limites

### A) Sécurité

✅ **Bonnes pratiques appliquées :**
- API key côté serveur uniquement (jamais exposée au client)
- Validation stricte des entrées utilisateur
- Erreurs détaillées loggées mais messages génériques à l'utilisateur
- Pas de publication automatique (toujours brouillon)

### B) Limites

- **Max tokens :** 4000 (limite haute pour éviter les coûts excessifs)
- **Rate limits OpenAI :** Selon votre tier (Tier 1: ~3500 RPM)
- **Timeout :** Pas de timeout explicite (API Next.js par défaut: 60s)
- **Concurrent jobs :** Pas de limitation (à implémenter si nécessaire)

---

## 7. Coûts estimés

**Avec `gpt-4o-mini` :**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Estimation par article :**
- Prompt système + contexte : ~1000 tokens
- Génération (article 700 mots) : ~1500 tokens
- **Coût total : ~$0.001 par article** (0.1 centime)

Pour 1000 articles/mois : ~$1

---

## 8. Tests

### Lancer les tests

```bash
npm test -- generateArticleFromIdea.test.ts
```

**Tests inclus :**
1. Génération valide au premier essai
2. Retry après échec de validation
3. Échec après max retries
4. Prompt système contient les contraintes

---

## 9. Prochaines étapes (non implémentées)

### Level 5.2 (futur) :
- Auto-suggestion de sujets (AI-generated ideas)
- Support RSS feeds → content_idea
- Batch generation (plusieurs articles d'un coup)
- Planification de génération (cron)
- Génération d'images via DALL-E
- Optimisation SEO automatique
- Multi-langues avec traduction

---

## 10. Dépannage

### Erreur : "OpenAI n'est pas configuré"

➡️ Vérifier que `OPENAI_API_KEY` est bien défini dans `.env`

### Erreur : "Aucun auteur actif trouvé"

➡️ Créer au moins un auteur avec status='active' dans la section Auteurs

### Erreur : "Type de contenu introuvable"

➡️ Vérifier que des types de contenu existent avec status='active'

### Génération échoue après 3 tentatives

➡️ Vérifier les logs dans `ai_job` table :

```sql
SELECT * FROM ai_job 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Article généré ne respecte pas les règles

➡️ Vérifier que `rules_json` est bien formé dans `content_types` table

---

## Critères d'acceptation ✅

- [x] Migrations SQL exécutées (content_idea, ai_job)
- [x] Types TypeScript à jour
- [x] SDK OpenAI installé
- [x] Client OpenAI configuré
- [x] Service de génération avec validation loop
- [x] API endpoint `/api/admin/sites/[id]/articles/generate`
- [x] Page UI `/admin/sites/[id]/articles/new-ai`
- [x] Bouton "Article IA" sur le dashboard
- [x] Tests unitaires passent
- [x] Auteur sélectionné selon preferred_role_keys
- [x] Articles créés en brouillon uniquement
- [x] Erreurs visibles et actionnables

**Tous les critères sont remplis ! 🎉**
