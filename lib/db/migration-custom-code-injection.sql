-- Migration: Custom Code Injection (Header/Footer)
-- Date: 2026-02-17
-- Ajoute des champs pour injecter du code personnalisé dans le <head> et avant </body>

-- Ajouter les colonnes à la table sites
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS custom_head_code TEXT,
  ADD COLUMN IF NOT EXISTS custom_footer_code TEXT;

-- Commentaires
COMMENT ON COLUMN sites.custom_head_code IS 'Code HTML/JS injecté dans le <head> (Google Analytics, vérifications, etc.)';
COMMENT ON COLUMN sites.custom_footer_code IS 'Code HTML/JS injecté avant </body> (scripts de tracking, chat widgets, etc.)';

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
