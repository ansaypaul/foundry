-- Migration : Ajouter support pour robots.txt personnalisé
-- Permet à chaque site de définir son propre robots.txt

ALTER TABLE seo_settings
ADD COLUMN IF NOT EXISTS custom_robots_txt TEXT DEFAULT NULL;

COMMENT ON COLUMN seo_settings.custom_robots_txt IS 'Contenu personnalisé du fichier robots.txt (NULL = utiliser le défaut)';

-- Exemple de mise à jour pour un site (optionnel)
-- UPDATE seo_settings 
-- SET custom_robots_txt = 'User-agent: *
-- Allow: /
-- Disallow: /admin/
-- 
-- Sitemap: https://example.com/sitemap.xml'
-- WHERE site_id = 'votre-site-id';
