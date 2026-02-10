-- Migration: Ajouter le statut 'scheduled' pour les articles planifiés

-- 1. Supprimer l'ancienne contrainte sur status
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_status_check;

-- 2. Ajouter la nouvelle contrainte avec 'scheduled'
ALTER TABLE content ADD CONSTRAINT content_status_check 
    CHECK (status IN ('draft', 'published', 'scheduled'));

-- 3. Créer un index pour les articles planifiés
CREATE INDEX IF NOT EXISTS idx_content_scheduled 
    ON content(published_at) 
    WHERE status = 'scheduled';

-- Note: Les articles avec status='scheduled' et published_at <= NOW() 
-- devront être passés en 'published' par un job/cron
