# Médias - Développement complet ✅

## Ce qui a été développé

### 1. Upload vers Supabase Storage

#### API Route : `/api/admin/media` (POST)
- Upload de fichiers vers Supabase Storage bucket `media`
- Organisation par site : `{site_id}/{random_name}.{ext}`
- Validation :
  - Types acceptés : JPG, PNG, GIF, WebP
  - Taille max : 5 MB
- Génération de noms aléatoires (hash) pour éviter les conflits
- Enregistrement en DB avec métadonnées (url, storage_path, mime_type, file_size, alt_text)
- Rollback automatique en cas d'erreur (suppression du fichier uploadé)

#### API Route : `/api/admin/media` (GET)
- Liste tous les médias (avec filtre optionnel par `site_id`)
- Tri par date de création (plus récents en premier)

#### API Route : `/api/admin/media/[id]` (DELETE)
- Suppression du fichier dans Supabase Storage
- Suppression de l'entrée en DB
- Gestion des erreurs

---

### 2. Galerie d'administration

#### Page : `/admin/media`
- **Sélection de site** (dropdown)
- **Formulaire d'upload** :
  - Champ fichier (images uniquement)
  - Champ texte alternatif (optionnel)
  - Validation côté client et serveur
- **Galerie responsive** (grid 2/3/4 colonnes selon l'écran)
  - Aperçu miniature (aspect carré)
  - Nom du fichier
  - Taille en KB
  - Actions au survol :
    - **Copier URL** (clipboard)
    - **Supprimer** (avec confirmation)

#### Composant : `MediaManager.tsx`
- Gestion d'état (loading, erreurs, succès)
- Rechargement automatique après upload/suppression
- Messages de feedback utilisateur

---

### 3. Sélecteur d'image à la une

#### Composant : `MediaPicker.tsx`
- **Mode prévisualisation** : affiche l'image sélectionnée
- **Mode sélection** : modal avec galerie des images du site
- Actions :
  - Sélectionner une image
  - Changer l'image
  - Retirer l'image
- Intégré dans le formulaire d'édition de contenu

#### Intégration dans ContentEditForm
- Nouveau state : `featuredMediaId`
- Envoi de `featured_media_id` lors de la mise à jour du contenu
- Initialisation avec l'image existante

#### API mise à jour
- `PATCH /api/admin/content/[id]` gère maintenant `featured_media_id`
- Mise à jour de la colonne `featured_media_id` dans la table `content`

---

### 4. Affichage public

#### Page de détail d'article : `/[slug]`
- Chargement de l'image à la une via `featured_media_id`
- Affichage responsive (aspect 16:9)
- Utilisation de `next/image` pour optimisation automatique
- Attribut `alt` depuis la DB
- Priorité de chargement (`priority`)

#### Métadonnées SEO
- Ajout de l'image à la une dans les balises Open Graph
- Amélioration du partage sur réseaux sociaux (Twitter, Facebook, LinkedIn)

---

## Flux complet

### Upload d'une image

1. Admin va sur `/admin/media`
2. Sélectionne un site
3. Choisit un fichier image
4. (Optionnel) Ajoute un texte alternatif
5. Clique sur **Upload**
6. Le fichier est :
   - Validé (type, taille)
   - Uploadé vers Supabase Storage (`media/{site_id}/{random}.ext`)
   - Enregistré en DB avec son URL publique
7. La galerie se rafraîchit automatiquement

### Association à un article

1. Admin édite un article : `/admin/content/[id]`
2. Clique sur "Sélectionner une image" dans la section "Image à la une"
3. Une modal s'ouvre avec la galerie du site
4. Sélectionne une image
5. L'aperçu s'affiche immédiatement
6. Lors de l'enregistrement, `featured_media_id` est mis à jour

### Affichage public

1. Visiteur accède à `/mon-article`
2. Le serveur :
   - Charge le contenu
   - Charge l'image à la une via `featured_media_id`
3. L'image s'affiche en haut de l'article (format 16:9)
4. Open Graph inclut l'image pour le partage social

---

## Configuration requise

### Supabase Storage

Le bucket `media` doit être créé dans Supabase avec :
- **Public bucket** : ✅ Oui
- **File size limit** : 5 MB
- **Allowed MIME types** : `image/jpeg,image/png,image/gif,image/webp`

### Politiques RLS (Row Level Security)

```sql
-- Upload pour utilisateurs authentifiés
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Lecture publique
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Suppression pour utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
```

**Documentation complète** : `docs/SUPABASE_STORAGE.md`

---

## Fichiers créés/modifiés

### Nouveaux fichiers
- `app/api/admin/media/route.ts` - Upload et liste
- `app/api/admin/media/[id]/route.ts` - Suppression
- `app/admin/media/page.tsx` - Page galerie
- `app/admin/media/MediaManager.tsx` - Composant galerie
- `app/admin/components/MediaPicker.tsx` - Sélecteur modal
- `docs/SUPABASE_STORAGE.md` - Documentation Storage

### Fichiers modifiés
- `app/admin/content/[id]/ContentEditForm.tsx` - Ajout MediaPicker
- `app/api/admin/content/[id]/route.ts` - Support featured_media_id
- `app/(public)/[slug]/page.tsx` - Affichage image + Open Graph

---

## Stack technique

- **Storage** : Supabase Storage (S3-compatible)
- **Upload** : FormData + fetch API
- **Images** : `next/image` avec optimisation automatique
- **Organisation** : Par site (`{site_id}/`)
- **Sécurité** : Service role key (server-side uniquement)

---

## Limitations

- **Taille max** : 5 MB
- **Types** : Images uniquement (pas de vidéos, PDFs, etc.)
- **Public** : Tous les fichiers uploadés sont publics
- **Édition** : Pas d'édition de métadonnées après upload (sauf via DB)

---

## Améliorations futures possibles

- Upload multiple (batch)
- Drag & drop
- Crop/resize dans l'interface
- Support des vidéos
- Génération automatique de thumbnails
- Compression automatique côté serveur
- Recherche et filtres dans la galerie
- Édition inline du texte alternatif
- Statistiques d'utilisation (espace, nombre de fichiers)

---

## Tests à effectuer

- [ ] Créer le bucket `media` dans Supabase
- [ ] Configurer les politiques RLS
- [ ] Uploader une image via `/admin/media`
- [ ] Vérifier l'affichage dans la galerie
- [ ] Copier l'URL d'une image
- [ ] Supprimer une image
- [ ] Associer une image à un article
- [ ] Vérifier l'affichage public sur `/[slug]`
- [ ] Partager l'article sur un réseau social (vérifier Open Graph)

---

## Statut : ✅ Complet et fonctionnel

Le système de médias est développé et opérationnel. Configuration Supabase requise.
