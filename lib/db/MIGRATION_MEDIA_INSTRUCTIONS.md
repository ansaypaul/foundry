# Instructions pour la migration des médias

## 📝 Migration à exécuter dans Supabase

Lance ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Migration: Ajouter les champs WordPress pour les médias
-- Date: 2026-02-08

-- Ajouter les colonnes manquantes à la table media
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
```

## ✅ Nouveaux champs médias

Après la migration, chaque média aura :

- **filename** : Nom du fichier
- **url** : URL publique
- **storage_path** : Chemin dans Supabase Storage
- **alt_text** : Texte alternatif (accessibilité)
- **title** : Titre du média
- **caption** : Légende (affichée sous l'image)
- **description** : Description détaillée (interne)
- **mime_type** : Type de fichier
- **file_size** : Taille du fichier

## 🎯 Nouvelles fonctionnalités

1. **Édition de média** : `/admin/sites/[id]/media/[mediaId]`
   - Modifier tous les champs
   - Voir la prévisualisation
   - Copier l'URL
   - Supprimer le média

2. **Galerie améliorée** :
   - Bouton "✏️ Éditer" sur chaque média
   - Bouton "📋" pour copier l'URL
   - Bouton "✕" pour supprimer

3. **Upload dans MediaPicker** :
   - Onglet "Galerie" : sélectionner un média existant
   - Onglet "Upload" : uploader directement depuis le formulaire

## 🔄 Ordre d'exécution

1. ✅ Exécute le SQL de migration dans Supabase
2. ✅ Recharge la page admin
3. ✅ Teste l'édition d'un média
4. ✅ Teste l'upload depuis un article

Tous les fichiers sont déjà en place, il suffit de faire la migration SQL ! 🚀
