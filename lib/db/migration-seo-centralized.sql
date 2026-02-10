-- Migration : SEO Centralisé
-- Déplace tous les champs SEO vers une table unique seo_meta

-- ===================================
-- 1. CRÉER LA TABLE SEO_META
-- ===================================
CREATE TABLE IF NOT EXISTS seo_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence polymorphique
    entity_type TEXT NOT NULL CHECK (entity_type IN ('content', 'term', 'site')),
    entity_id UUID NOT NULL,
    
    -- Title & Description
    seo_title TEXT,
    seo_description TEXT,
    
    -- Canonical
    seo_canonical TEXT,
    
    -- Robots directives
    seo_robots_index BOOLEAN DEFAULT true,
    seo_robots_follow BOOLEAN DEFAULT true,
    
    -- Focus keyword (pour analysis)
    seo_focus_keyword TEXT,
    
    -- Open Graph
    seo_og_title TEXT,
    seo_og_description TEXT,
    seo_og_image TEXT,
    seo_og_type TEXT DEFAULT 'article',
    
    -- Twitter
    seo_twitter_title TEXT,
    seo_twitter_description TEXT,
    seo_twitter_image TEXT,
    seo_twitter_card TEXT DEFAULT 'summary_large_image' CHECK (seo_twitter_card IN ('summary', 'summary_large_image')),
    
    -- Breadcrumbs override
    seo_breadcrumb_title TEXT,
    
    -- SEO Score (0-100)
    seo_score INTEGER DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index unique : une seule config SEO par entité
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_meta_entity ON seo_meta(entity_type, entity_id);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_seo_meta_entity_type ON seo_meta(entity_type);
CREATE INDEX IF NOT EXISTS idx_seo_meta_entity_id ON seo_meta(entity_id);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_seo_meta_updated_at ON seo_meta;
CREATE TRIGGER update_seo_meta_updated_at 
    BEFORE UPDATE ON seo_meta
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE seo_meta IS 'Métadonnées SEO centralisées pour toutes les entités (content, terms, sites)';
COMMENT ON COLUMN seo_meta.entity_type IS 'Type d''entité : content, term, site';
COMMENT ON COLUMN seo_meta.entity_id IS 'ID de l''entité référencée';
COMMENT ON COLUMN seo_meta.seo_title IS 'Custom SEO title (fallback: entity title/name)';
COMMENT ON COLUMN seo_meta.seo_description IS 'Custom meta description';
COMMENT ON COLUMN seo_meta.seo_canonical IS 'Canonical URL override';
COMMENT ON COLUMN seo_meta.seo_robots_index IS 'Allow search engine indexing';
COMMENT ON COLUMN seo_meta.seo_robots_follow IS 'Allow search engine to follow links';
COMMENT ON COLUMN seo_meta.seo_focus_keyword IS 'Primary keyword for SEO analysis';
COMMENT ON COLUMN seo_meta.seo_score IS 'SEO score (0-100) based on automated analysis';

-- ===================================
-- 2. MIGRER LES DONNÉES EXISTANTES
-- ===================================

-- Migrer depuis content (si les colonnes existent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content' AND column_name = 'seo_title'
    ) THEN
        INSERT INTO seo_meta (
            entity_type, entity_id,
            seo_title, seo_description, seo_canonical,
            seo_robots_index, seo_robots_follow, seo_focus_keyword,
            seo_og_title, seo_og_description, seo_og_image, seo_og_type,
            seo_twitter_title, seo_twitter_description, seo_twitter_image, seo_twitter_card,
            seo_breadcrumb_title, seo_score
        )
        SELECT 
            'content', id,
            seo_title, seo_description, seo_canonical,
            seo_robots_index, seo_robots_follow, seo_focus_keyword,
            seo_og_title, seo_og_description, seo_og_image, seo_og_type,
            seo_twitter_title, seo_twitter_description, seo_twitter_image, seo_twitter_card,
            seo_breadcrumb_title, seo_score
        FROM content
        WHERE seo_title IS NOT NULL 
           OR seo_description IS NOT NULL
           OR seo_canonical IS NOT NULL
           OR seo_og_title IS NOT NULL
           OR seo_twitter_title IS NOT NULL
        ON CONFLICT (entity_type, entity_id) DO NOTHING;
    END IF;
END $$;

-- Migrer depuis terms (si les colonnes existent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'terms' AND column_name = 'seo_title'
    ) THEN
        INSERT INTO seo_meta (
            entity_type, entity_id,
            seo_title, seo_description, seo_canonical,
            seo_robots_index, seo_robots_follow,
            seo_og_title, seo_og_description, seo_og_image,
            seo_twitter_title, seo_twitter_description, seo_twitter_image, seo_twitter_card
        )
        SELECT 
            'term', id,
            seo_title, seo_description, seo_canonical,
            seo_robots_index, seo_robots_follow,
            seo_og_title, seo_og_description, seo_og_image,
            seo_twitter_title, seo_twitter_description, seo_twitter_image, seo_twitter_card
        FROM terms
        WHERE seo_title IS NOT NULL 
           OR seo_description IS NOT NULL
           OR seo_canonical IS NOT NULL
           OR seo_og_title IS NOT NULL
           OR seo_twitter_title IS NOT NULL
        ON CONFLICT (entity_type, entity_id) DO NOTHING;
    END IF;
END $$;

-- ===================================
-- 3. SUPPRIMER LES ANCIENNES COLONNES
-- ===================================

-- Supprimer de content
ALTER TABLE content
DROP COLUMN IF EXISTS seo_title,
DROP COLUMN IF EXISTS seo_description,
DROP COLUMN IF EXISTS seo_canonical,
DROP COLUMN IF EXISTS seo_robots_index,
DROP COLUMN IF EXISTS seo_robots_follow,
DROP COLUMN IF EXISTS seo_focus_keyword,
DROP COLUMN IF EXISTS seo_og_title,
DROP COLUMN IF EXISTS seo_og_description,
DROP COLUMN IF EXISTS seo_og_image,
DROP COLUMN IF EXISTS seo_og_type,
DROP COLUMN IF EXISTS seo_twitter_title,
DROP COLUMN IF EXISTS seo_twitter_description,
DROP COLUMN IF EXISTS seo_twitter_image,
DROP COLUMN IF EXISTS seo_twitter_card,
DROP COLUMN IF EXISTS seo_breadcrumb_title,
DROP COLUMN IF EXISTS seo_score;

-- Supprimer de terms
ALTER TABLE terms
DROP COLUMN IF EXISTS seo_title,
DROP COLUMN IF EXISTS seo_description,
DROP COLUMN IF EXISTS seo_canonical,
DROP COLUMN IF EXISTS seo_robots_index,
DROP COLUMN IF EXISTS seo_robots_follow,
DROP COLUMN IF EXISTS seo_og_title,
DROP COLUMN IF EXISTS seo_og_description,
DROP COLUMN IF EXISTS seo_og_image,
DROP COLUMN IF EXISTS seo_twitter_title,
DROP COLUMN IF EXISTS seo_twitter_description,
DROP COLUMN IF EXISTS seo_twitter_image,
DROP COLUMN IF EXISTS seo_twitter_card;
