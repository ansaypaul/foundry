# Configuration Supabase Storage

## Création du bucket `media`

Pour que l'upload de médias fonctionne, vous devez créer un bucket Supabase Storage.

### 1. Accéder au Storage

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Dans le menu de gauche, cliquez sur **Storage**

### 2. Créer le bucket

1. Cliquez sur **New bucket**
2. Remplissez les informations :
   - **Name** : `media`
   - **Public** : ✅ Cochez "Public bucket"
   - **File size limit** : `5242880` (5 MB en octets)
   - **Allowed MIME types** : `image/jpeg,image/png,image/gif,image/webp`

3. Cliquez sur **Create bucket**

### 3. Configurer les politiques RLS (Row Level Security)

Par défaut, Supabase Storage applique des politiques RLS. Pour permettre l'upload et l'accès public :

#### Option A : Via l'interface Supabase

1. Cliquez sur le bucket `media`
2. Allez dans l'onglet **Policies**
3. Créez les politiques suivantes :

**Policy 1 : Upload**
```sql
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);
```

**Policy 2 : Public read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');
```

**Policy 3 : Delete**
```sql
CREATE POLICY "Allow delete for authenticated users"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);
```

#### Option B : Via SQL Editor

Allez dans **SQL Editor** et exécutez :

```sql
-- Allow upload for authenticated users
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow delete for authenticated users
CREATE POLICY "Allow delete for authenticated users"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);
```

---

## Structure des fichiers

Les fichiers sont organisés par site :

```
media/
├── {site_id_1}/
│   ├── abc123.jpg
│   ├── def456.png
│   └── ...
├── {site_id_2}/
│   ├── xyz789.webp
│   └── ...
└── ...
```

Chaque fichier uploadé :
- Est renommé avec un hash aléatoire unique
- Conserve son extension d'origine
- Est stocké dans un dossier par site (`{site_id}/`)

---

## Utilisation dans l'admin

### Upload d'images

1. Aller sur `/admin/media`
2. Sélectionner un site
3. Choisir un fichier (JPG, PNG, GIF, WebP, max 5MB)
4. Optionnel : ajouter un texte alternatif
5. Cliquer sur **Upload**

### Galerie

La galerie affiche toutes les images d'un site avec :
- Aperçu miniature
- Nom du fichier
- Taille en KB
- Actions : **Copier URL** et **Supprimer**

### Sélection d'image à la une

Lors de l'édition d'un article (`/admin/content/[id]`) :
- Une section "Image à la une" permet de sélectionner une image
- Cliquez sur le bouton pour ouvrir la galerie
- Sélectionnez une image
- Elle s'affichera automatiquement sur la page publique de l'article

---

## Affichage public

L'image à la une est affichée :
- Sur la page de détail de l'article (`/[slug]`)
- Dans les métadonnées Open Graph (partage sur réseaux sociaux)
- Format : aspect ratio 16:9, optimisé par Next.js Image

---

## Limites actuelles

- **Taille max** : 5 MB par fichier
- **Types** : Images uniquement (JPG, PNG, GIF, WebP)
- **Bucket** : `media` (public)
- **Organisation** : Par site

---

## Sécurité

- L'upload nécessite la `SUPABASE_SERVICE_ROLE_KEY` (admin)
- Les fichiers sont publics une fois uploadés
- La suppression d'un média supprime aussi le fichier du Storage
- Les noms de fichiers sont randomisés pour éviter les conflits

---

## Troubleshooting

### Erreur : "Bucket not found"
→ Créez le bucket `media` comme décrit ci-dessus

### Erreur : "new row violates row-level security policy"
→ Configurez les politiques RLS pour le bucket

### Erreur : "File too large"
→ Limite de 5 MB, réduisez la taille de l'image

### L'image ne s'affiche pas
→ Vérifiez que le bucket `media` est configuré en **Public**

---

## Prochaines améliorations possibles

- Support des vidéos
- Redimensionnement automatique des images
- Génération de thumbnails
- Compression automatique
- Recherche et filtres dans la galerie
- Édition du texte alternatif après upload
