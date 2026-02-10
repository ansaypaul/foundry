-- Migration : Configuration des schémas JSON-LD
-- Permet de configurer les types de schémas pour améliorer le SEO

ALTER TABLE seo_settings
ADD COLUMN IF NOT EXISTS schema_article_type TEXT DEFAULT 'Article' 
  CHECK (schema_article_type IN ('Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle')),
ADD COLUMN IF NOT EXISTS schema_enable_organization BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS schema_enable_website BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS schema_enable_breadcrumbs BOOLEAN DEFAULT true;

COMMENT ON COLUMN seo_settings.schema_article_type IS 'Type de schéma pour les articles (Article, NewsArticle, BlogPosting, etc.)';
COMMENT ON COLUMN seo_settings.schema_enable_organization IS 'Activer le schéma Organization';
COMMENT ON COLUMN seo_settings.schema_enable_website IS 'Activer le schéma WebSite';
COMMENT ON COLUMN seo_settings.schema_enable_breadcrumbs IS 'Activer le schéma BreadcrumbList';

-- Exemples de configuration par type de site :

-- Site d'actualités
-- UPDATE seo_settings SET schema_article_type = 'NewsArticle' WHERE site_id = 'xxx';

-- Blog personnel
-- UPDATE seo_settings SET schema_article_type = 'BlogPosting' WHERE site_id = 'xxx';

-- Site technique/documentation
-- UPDATE seo_settings SET schema_article_type = 'TechArticle' WHERE site_id = 'xxx';

-- Site académique/recherche
-- UPDATE seo_settings SET schema_article_type = 'ScholarlyArticle' WHERE site_id = 'xxx';
