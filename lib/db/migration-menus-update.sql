-- Migration : Mise à jour de la table menus
-- Date : 2026-02-08

-- Supprimer la contrainte UNIQUE existante
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_site_id_location_key;

-- Ajouter la colonne name si elle n'existe pas
ALTER TABLE menus ADD COLUMN IF NOT EXISTS name TEXT;

-- Ajouter la colonne position si elle n'existe pas
ALTER TABLE menus ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Mettre à jour la contrainte CHECK pour location
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_location_check;
ALTER TABLE menus ADD CONSTRAINT menus_location_check 
  CHECK (location IN ('header', 'footer', 'sidebar'));

-- Remettre la contrainte UNIQUE
ALTER TABLE menus ADD CONSTRAINT menus_site_id_location_key UNIQUE(site_id, location);

-- Mettre à jour les menus existants sans nom
UPDATE menus SET name = 'Menu ' || location WHERE name IS NULL OR name = '';

-- Rendre name NOT NULL
ALTER TABLE menus ALTER COLUMN name SET NOT NULL;

-- Forcer le rechargement
NOTIFY pgrst, 'reload schema';
