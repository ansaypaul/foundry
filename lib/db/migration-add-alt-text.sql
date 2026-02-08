-- Migration : Ajouter la colonne alt_text à la table media
-- Date : 2026-02-08

-- Ajouter la colonne alt_text
ALTER TABLE media ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Note : Cette colonne stocke le texte alternatif des images pour l'accessibilité
