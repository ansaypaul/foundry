-- Vérifie si la colonne modules_config existe dans la table themes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'themes' 
AND column_name = 'modules_config';

-- Vérifie si la colonne theme_config existe dans la table sites  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sites'
AND column_name = 'theme_config';

-- Vérifie le contenu de theme_config pour ton site
SELECT id, name, theme_config
FROM sites
LIMIT 5;
