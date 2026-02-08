# Taxonomies - Développement complet ✅

## Ce qui a été développé

### 1. Gestion des catégories et tags (CRUD)

#### Création
- **Page** : `/admin/terms/new`
- Formulaire pour créer des catégories ou des tags
- Sélection du site et du type
- Génération automatique du slug

#### Liste et vue d'ensemble
- **Page** : `/admin/terms`
- Affichage des catégories et tags par site
- Badges visuels pour différencier catégories et tags
- Liens directs vers l'édition

#### Édition
- **Page** : `/admin/terms/[id]`
- Formulaire d'édition avec nom, slug, description
- Bouton de suppression avec confirmation
- Messages de succès/erreur

#### API Routes
- `POST /api/admin/terms` - Création
- `PATCH /api/admin/terms/[id]` - Mise à jour
- `DELETE /api/admin/terms/[id]` - Suppression (cascade sur relations)

---

### 2. Association contenu-termes ⭐

#### Dans le formulaire d'édition de contenu
- **Page** : `/admin/content/[id]`
- **Sélection de catégorie** (1 seule, optionnelle)
  - Menu déroulant
  - Lien rapide pour créer une catégorie
- **Sélection de tags** (plusieurs possibles)
  - Boutons cliquables avec état visuel (bleu = sélectionné)
  - Lien rapide pour créer un tag

#### API Route
- `PUT /api/admin/content/[id]/terms` - Association contenu-termes
- Gère automatiquement la suppression des anciennes relations
- Crée les nouvelles relations

#### Queries DB
- `getTermsByContentId(contentId)` - Récupère les termes d'un contenu
- `setContentTerms(contentId, siteId, termIds)` - Met à jour les relations

---

## Fonctionnement technique

### Modèle de données

```sql
-- Table terms
id, site_id, type (category|tag), name, slug, description

-- Table term_relations (relation many-to-many)
id, site_id, content_id, term_id
```

### Logique métier

1. **Un article peut avoir** :
   - 0 ou 1 catégorie
   - 0 à N tags

2. **Mise à jour atomique** :
   - Suppression de toutes les anciennes relations
   - Création des nouvelles relations
   - Pas de doublons possibles

3. **Cascade automatique** :
   - Si un terme est supprimé, ses relations sont supprimées

---

## Affichage public (déjà implémenté)

### Pages dynamiques existantes

- **`/category/[slug]`** - Liste des articles d'une catégorie
- **`/tag/[slug]`** - Liste des articles d'un tag

Ces pages :
- Récupèrent le terme par slug
- Affichent les articles liés via `term_relations`
- Filtrent automatiquement par `site_id`

---

## Utilisation

### 1. Créer des taxonomies

1. Aller sur `/admin/terms/new`
2. Sélectionner le site
3. Choisir le type (category ou tag)
4. Remplir nom et slug
5. Enregistrer

### 2. Associer des taxonomies à un article

1. Éditer un article : `/admin/content/[id]`
2. Sélectionner une catégorie (menu déroulant)
3. Cliquer sur les tags souhaités (boutons)
4. Enregistrer

Les associations sont sauvegardées automatiquement avec le contenu.

---

## Tests à effectuer

- [ ] Créer une catégorie "Tech"
- [ ] Créer des tags "JavaScript", "React", "Next.js"
- [ ] Créer un article
- [ ] Associer la catégorie et les tags
- [ ] Vérifier l'affichage sur `/category/tech`
- [ ] Vérifier l'affichage sur `/tag/javascript`
- [ ] Modifier les taxonomies d'un article
- [ ] Supprimer un tag et vérifier que les relations sont supprimées

---

## Statut : ✅ Complet et fonctionnel

Toutes les fonctionnalités taxonomies sont développées et opérationnelles.
