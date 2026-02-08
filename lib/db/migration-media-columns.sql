-- Migration : Ajouter les colonnes manquantes à la table media
-- Date : 2026-02-08

-- Ajouter filename (nom original du fichier)
ALTER TABLE media ADD COLUMN IF NOT EXISTS filename TEXT;

-- Ajouter storage_path (chemin dans Supabase Storage)
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Mettre à jour les contraintes si nécessaire
ALTER TABLE media ALTER COLUMN filename SET NOT NULL;
ALTER TABLE media ALTER COLUMN storage_path SET NOT NULL;

-- Forcer le rechargement du cache PostgREST
NOTIFY pgrst, 'reload schema';

-- Note : Si des lignes existent déjà sans ces colonnes, la contrainte NOT NULL échouera.
-- Dans ce cas, supprimez d'abord les lignes existantes ou mettez des valeurs par défaut.
