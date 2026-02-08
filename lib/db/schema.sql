-- Foundry Database Schema
-- Multi-tenant CMS platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- SITES TABLE
-- ======================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    theme_key TEXT NOT NULL DEFAULT 'default',
    theme_config JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sites_status ON sites(status);

-- ======================
-- DOMAINS TABLE
-- ======================
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL UNIQUE,
    is_primary BOOLEAN DEFAULT false,
    redirect_to_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_domains_site_id ON domains(site_id);
CREATE INDEX idx_domains_hostname ON domains(hostname);

-- Ensure only one primary domain per site
CREATE UNIQUE INDEX idx_domains_one_primary_per_site 
ON domains(site_id) 
WHERE is_primary = true;

-- ======================
-- USERS TABLE
-- ======================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ======================
-- MEMBERSHIPS TABLE
-- ======================
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'author')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, site_id)
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_site_id ON memberships(site_id);

-- ======================
-- CONTENT TABLE
-- ======================
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('post', 'page')),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content_html TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    featured_media_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique slug per site and type
CREATE UNIQUE INDEX idx_content_site_type_slug ON content(site_id, type, slug);
CREATE INDEX idx_content_site_id ON content(site_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published_at ON content(published_at) WHERE status = 'published';

-- ======================
-- TERMS TABLE (Categories & Tags)
-- ======================
CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('category', 'tag')),
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique slug per site and type
CREATE UNIQUE INDEX idx_terms_site_type_slug ON terms(site_id, type, slug);
CREATE INDEX idx_terms_site_id ON terms(site_id);
CREATE INDEX idx_terms_type ON terms(type);

-- ======================
-- TERM RELATIONS TABLE
-- ======================
CREATE TABLE term_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, term_id)
);

CREATE INDEX idx_term_relations_site_id ON term_relations(site_id);
CREATE INDEX idx_term_relations_content_id ON term_relations(content_id);
CREATE INDEX idx_term_relations_term_id ON term_relations(term_id);

-- ======================
-- MEDIA TABLE
-- ======================
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    title TEXT,
    caption TEXT,
    description TEXT,
    mime_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_media_site_id ON media(site_id);

-- Add foreign key constraint for featured_media_id in content table
ALTER TABLE content ADD CONSTRAINT fk_content_featured_media 
FOREIGN KEY (featured_media_id) REFERENCES media(id) ON DELETE SET NULL;

-- ======================
-- MENUS TABLE
-- ======================
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('header', 'footer', 'sidebar')),
    items JSONB DEFAULT '[]',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, location)
);

CREATE INDEX idx_menus_site_id ON menus(site_id);

-- ======================
-- AI JOBS TABLE
-- ======================
CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    prompt_version TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_jobs_site_id ON ai_jobs(site_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_created_at ON ai_jobs(created_at);

-- ======================
-- UPDATED_AT TRIGGERS
-- ======================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- SEED DATA (Development)
-- ======================

-- Insert a default site for development (optionnel)
INSERT INTO sites (id, name, theme_key, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Site de développement', 'default', 'active');

-- Note: Pas de domaine localhost par défaut
-- localhost redirige automatiquement vers /admin
-- Les sites réels utilisent des sous-domaines (ex: monsite.localhost)

-- Insert default admin user (password: "admin123" - change in production!)
INSERT INTO users (id, email, password_hash, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@foundry.local', '$2a$10$rKvqDVOxEj9ZxYYPNTFqLOwBHKxN4zJXvO4MZMxRhJqI5VyHhj.Ae', 'Admin');

-- Give admin user admin access to the development site
INSERT INTO memberships (user_id, site_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin');
