-- Migration: Création de la table authors pour les profils publics des auteurs
-- Date: 2026-02-10
-- Description: Sépare l'authentification (users) des profils publics (authors)

-- ============================================
-- 1. Créer la table authors
-- ============================================

CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optionnel : lié à un user admin
  
  -- Identité publique
  slug VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255), -- Email public (optionnel, différent du user)
  
  -- Profil
  bio TEXT,
  avatar_url TEXT,
  
  -- Liens
  website_url TEXT,
  twitter_username VARCHAR(100),
  facebook_url TEXT,
  linkedin_url TEXT,
  instagram_username VARCHAR(100),
  github_username VARCHAR(100),
  
  -- Metadata
  posts_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(site_id, slug), -- Slug unique par site
  UNIQUE(site_id, user_id) -- Un user = un seul profil auteur par site
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_authors_site_id ON authors(site_id);
CREATE INDEX IF NOT EXISTS idx_authors_user_id ON authors(user_id);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(site_id, slug);

-- ============================================
-- 2. Migrer les données existantes
-- ============================================

-- Créer un auteur pour chaque user qui a des articles
INSERT INTO authors (site_id, user_id, slug, display_name, bio, created_at, updated_at)
SELECT DISTINCT
  c.site_id,
  c.author_id AS user_id,
  LOWER(REGEXP_REPLACE(u.name, '[^a-zA-Z0-9]', '-', 'g')) AS slug,
  u.name AS display_name,
  'Auteur sur ' || s.name AS bio,
  NOW(),
  NOW()
FROM content c
INNER JOIN users u ON c.author_id = u.id
INNER JOIN sites s ON c.site_id = s.id
WHERE c.author_id IS NOT NULL
ON CONFLICT (site_id, user_id) DO NOTHING;

-- ============================================
-- 3. Ajouter la nouvelle colonne author_id dans content
-- ============================================

-- Ajouter la colonne (nullable pour l'instant)
ALTER TABLE content ADD COLUMN IF NOT EXISTS new_author_id UUID REFERENCES authors(id) ON DELETE SET NULL;

-- Remplir avec les nouveaux author_id
UPDATE content c
SET new_author_id = a.id
FROM authors a
WHERE a.site_id = c.site_id 
  AND a.user_id = c.author_id;

-- ============================================
-- 4. Renommer les colonnes (après vérification)
-- ============================================

-- ATTENTION: À exécuter manuellement après vérification que tout est bon
-- ALTER TABLE content RENAME COLUMN author_id TO old_user_id;
-- ALTER TABLE content RENAME COLUMN new_author_id TO author_id;
-- ALTER TABLE content DROP COLUMN old_user_id;

-- Pour l'instant, on garde les deux colonnes pour la transition

-- ============================================
-- 5. Trigger pour mettre à jour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_authors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_authors_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW
  EXECUTE FUNCTION update_authors_updated_at();

-- ============================================
-- 6. Trigger pour mettre à jour posts_count
-- ============================================

CREATE OR REPLACE FUNCTION update_author_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si insertion ou update qui change l'auteur
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.new_author_id != OLD.new_author_id)) THEN
    -- Incrémenter le nouveau auteur
    IF NEW.new_author_id IS NOT NULL AND NEW.status = 'published' THEN
      UPDATE authors 
      SET posts_count = posts_count + 1
      WHERE id = NEW.new_author_id;
    END IF;
    
    -- Décrémenter l'ancien auteur si update
    IF TG_OP = 'UPDATE' AND OLD.new_author_id IS NOT NULL AND OLD.status = 'published' THEN
      UPDATE authors 
      SET posts_count = posts_count - 1
      WHERE id = OLD.new_author_id;
    END IF;
  END IF;
  
  -- Si suppression
  IF TG_OP = 'DELETE' AND OLD.new_author_id IS NOT NULL AND OLD.status = 'published' THEN
    UPDATE authors 
    SET posts_count = posts_count - 1
    WHERE id = OLD.new_author_id;
  END IF;
  
  -- Si changement de status
  IF TG_OP = 'UPDATE' AND NEW.new_author_id = OLD.new_author_id THEN
    IF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE authors SET posts_count = posts_count - 1 WHERE id = OLD.new_author_id;
    ELSIF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE authors SET posts_count = posts_count + 1 WHERE id = NEW.new_author_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_author_posts_count
  AFTER INSERT OR UPDATE OR DELETE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_author_posts_count();

-- ============================================
-- 7. Initialiser les posts_count
-- ============================================

UPDATE authors a
SET posts_count = (
  SELECT COUNT(*)
  FROM content c
  WHERE c.new_author_id = a.id
    AND c.status = 'published'
    AND c.type = 'post'
);

-- ============================================
-- NOTES
-- ============================================

-- Pour rollback (si besoin):
-- DROP TRIGGER IF EXISTS trigger_update_author_posts_count ON content;
-- DROP TRIGGER IF EXISTS trigger_authors_updated_at ON authors;
-- DROP FUNCTION IF EXISTS update_author_posts_count();
-- DROP FUNCTION IF EXISTS update_authors_updated_at();
-- ALTER TABLE content DROP COLUMN IF EXISTS new_author_id;
-- DROP TABLE IF EXISTS authors;
