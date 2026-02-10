# Migration vers le système Authors

## Vue d'ensemble

Cette migration sépare l'authentification (users) des profils publics d'auteurs (authors) pour améliorer le SEO et permettre des pages auteur riches.

## Architecture

### Avant
```
users → content.author_id
```

### Après
```
users (authentification)
  ↓
memberships (qui gère quel site)
  ↓
authors (profils publics par site)
  ↓
content.new_author_id
```

## Étapes de migration

### 1. Exécuter la migration SQL

```bash
psql -U postgres -d foundry_db -f lib/db/migration-authors.sql
```

Cette migration va :
- ✅ Créer la table `authors`
- ✅ Migrer les données existantes (users → authors)
- ✅ Ajouter la colonne `new_author_id` dans `content`
- ✅ Créer les triggers pour `updated_at` et `posts_count`
- ✅ Initialiser les compteurs `posts_count`

### 2. Vérifier les données

```sql
-- Vérifier que tous les auteurs ont été migrés
SELECT COUNT(*) FROM authors;

-- Vérifier que tous les articles ont un author_id
SELECT COUNT(*) 
FROM content 
WHERE new_author_id IS NULL 
  AND author_id IS NOT NULL;
-- Devrait retourner 0

-- Vérifier les posts_count
SELECT display_name, posts_count, 
       (SELECT COUNT(*) FROM content WHERE new_author_id = authors.id AND status = 'published' AND type = 'post') as real_count
FROM authors
WHERE posts_count != (SELECT COUNT(*) FROM content WHERE new_author_id = authors.id AND status = 'published' AND type = 'post');
-- Devrait être vide
```

### 3. Mettre à jour le code

#### Fichiers à modifier :

**Queries :**
- ✅ `lib/db/authors-queries.ts` - Nouveau fichier créé
- ⏳ `lib/db/queries.ts` - Modifier les queries de content pour utiliser `new_author_id`
- ⏳ `lib/cached-queries.ts` - Charger l'auteur avec le content

**API Routes :**
- ⏳ `app/api/admin/content/[id]/route.ts` - Utiliser `new_author_id`
- ⏳ Créer `app/api/admin/sites/[id]/authors/*` pour gérer les auteurs

**Pages Admin :**
- ⏳ Créer `app/admin/sites/[id]/authors/page.tsx` - Liste des auteurs
- ⏳ Créer `app/admin/sites/[id]/authors/new/page.tsx` - Créer un auteur
- ⏳ Créer `app/admin/sites/[id]/authors/[authorId]/page.tsx` - Éditer un auteur

**Pages Publiques :**
- ✅ `app/sites/[siteId]/author/[slug]/page.tsx` - Page auteur créée

**Composants :**
- ⏳ Créer un sélecteur d'auteur dans le formulaire de content

**SEO :**
- ✅ `lib/core/seo/config.ts` - Type `SeoContext` mis à jour
- ✅ `lib/core/seo/resolver.ts` - Schéma auteur enrichi

### 4. Tester

1. **Créer un auteur dans l'admin**
   - Aller dans Admin → Site → Authors → Nouveau
   - Remplir nom, bio, photo, réseaux sociaux
   - Sauvegarder

2. **Assigner l'auteur à un article**
   - Éditer un article
   - Sélectionner l'auteur dans le dropdown
   - Publier

3. **Vérifier la page auteur publique**
   - Visiter `/author/nom-auteur`
   - Vérifier que les infos s'affichent
   - Vérifier que les articles sont listés

4. **Vérifier le schéma JSON-LD**
   - Visiter un article
   - Voir le code source (Ctrl+U)
   - Chercher `application/ld+json`
   - Vérifier que l'auteur a toutes les infos (name, image, sameAs, etc.)

### 5. Migration finale (après tests)

Une fois que tout fonctionne :

```sql
-- Renommer les colonnes
ALTER TABLE content RENAME COLUMN author_id TO old_user_id;
ALTER TABLE content RENAME COLUMN new_author_id TO author_id;

-- Optionnel : Supprimer l'ancienne colonne après vérification
-- ALTER TABLE content DROP COLUMN old_user_id;
```

### 6. Mise à jour de la documentation

- [ ] Mettre à jour le README avec la nouvelle architecture
- [ ] Documenter l'API des auteurs
- [ ] Créer un guide utilisateur pour gérer les auteurs

## Rollback (si problème)

Si vous devez annuler la migration :

```sql
-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_update_author_posts_count ON content;
DROP TRIGGER IF EXISTS trigger_authors_updated_at ON authors;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_author_posts_count();
DROP FUNCTION IF EXISTS update_authors_updated_at();

-- Supprimer la colonne
ALTER TABLE content DROP COLUMN IF EXISTS new_author_id;

-- Supprimer la table
DROP TABLE IF EXISTS authors;
```

## Améliorations futures

- [ ] Import/export d'auteurs
- [ ] Gestion des avatars (upload)
- [ ] Statistiques par auteur
- [ ] Widget "Auteurs populaires" dans la sidebar
- [ ] Champ "auteur invité" pour les contributeurs externes
- [ ] Lien vers page auteur dans les articles
- [ ] Fil RSS par auteur
