-- Script de test : Créer plusieurs sites de test
-- Exécuter dans l'éditeur SQL de Supabase

-- Site 1 : Blog Tech
INSERT INTO sites (id, name, theme_key, status) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Blog Tech', 'default', 'active');

INSERT INTO domains (site_id, hostname, is_primary) 
VALUES ('11111111-1111-1111-1111-111111111111', 'tech.localhost', true);

-- Site 2 : Site Marketing
INSERT INTO sites (id, name, theme_key, status) 
VALUES ('22222222-2222-2222-2222-222222222222', 'Site Marketing', 'default', 'active');

INSERT INTO domains (site_id, hostname, is_primary) 
VALUES ('22222222-2222-2222-2222-222222222222', 'marketing.localhost', true);

-- Site 3 : Portfolio
INSERT INTO sites (id, name, theme_key, status) 
VALUES ('33333333-3333-3333-3333-333333333333', 'Portfolio', 'default', 'active');

INSERT INTO domains (site_id, hostname, is_primary) 
VALUES ('33333333-3333-3333-3333-333333333333', 'portfolio.localhost', true);

-- Ajouter quelques articles de test pour chaque site
INSERT INTO content (site_id, type, slug, title, excerpt, content_html, status, published_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'post', 'premier-article', 'Premier article du blog tech', 'Découvrez notre premier article sur la technologie.', '<p>Contenu de l''article...</p>', 'published', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'post', 'bienvenue', 'Bienvenue sur notre site', 'Découvrez nos services marketing.', '<p>Contenu marketing...</p>', 'published', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'post', 'mes-projets', 'Mes derniers projets', 'Voici mes réalisations.', '<p>Portfolio...</p>', 'published', NOW());

-- Vérifier que tout est bien créé
SELECT s.name, d.hostname 
FROM sites s 
LEFT JOIN domains d ON d.site_id = s.id
ORDER BY s.created_at DESC;
