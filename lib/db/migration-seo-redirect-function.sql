-- Fonction SQL pour incrémenter le compteur de hits d'une redirection

CREATE OR REPLACE FUNCTION increment_redirect_hit(redirect_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE seo_redirects
  SET 
    hit_count = hit_count + 1,
    last_hit_at = NOW()
  WHERE id = redirect_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_redirect_hit IS 'Incrémente le compteur de hits d''une redirection SEO';
