-- Migration: Ajouter les champs WordPress pour les médias
-- Date: 2026-02-08

-- Ajouter les colonnes manquantes à la table media
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Mettre à jour le trigger updated_at si nécessaire
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
