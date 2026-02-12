// Database types

export type SiteType = 'niche_passion' | 'news_media' | 'gaming_popculture' | 'affiliate_guides' | 'lifestyle';
export type AutomationLevel = 'manual' | 'ai_assisted' | 'ai_auto';
export type SetupStatus = 'draft' | 'blueprint_applied' | 'enriched';
export type AmbitionLevel = 'auto' | 'starter' | 'growth' | 'factory';

export interface Site {
  id: string;
  name: string;
  theme_key: string;
  theme_id: string | null;
  theme_config: Record<string, any>;
  status: 'active' | 'paused';
  // AI Bootstrap fields
  language: string;
  country: string;
  site_type: SiteType;
  automation_level: AutomationLevel;
  ambition_level: AmbitionLevel;
  description: string | null;
  setup_status: SetupStatus;
  active_blueprint_version: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Domain {
  id: string;
  site_id: string;
  hostname: string;
  is_primary: boolean;
  redirect_to_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Membership {
  id: string;
  user_id: string;
  site_id: string;
  role: 'admin' | 'editor' | 'author';
  created_at: Date;
}

export interface Author {
  id: string;
  site_id: string;
  user_id: string | null;
  slug: string;
  display_name: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  twitter_username: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  instagram_username: string | null;
  github_username: string | null;
  posts_count: number;
  // Authors Generator fields
  role_key: string | null;
  specialties: string[];
  is_ai: boolean;
  status: 'active' | 'inactive' | 'archived';
  // SEO fields (optional, from seo_meta table)
  seo_title?: string | null;
  seo_description?: string | null;
  seo_canonical?: string | null;
  seo_robots_index?: boolean;
  seo_robots_follow?: boolean;
  seo_og_title?: string | null;
  seo_og_description?: string | null;
  seo_og_image?: string | null;
  seo_twitter_card?: 'summary' | 'summary_large_image' | null;
  created_at: Date;
  updated_at: Date;
}

export interface Content {
  id: string;
  site_id: string;
  type: 'post' | 'page';
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string | null;
  status: 'draft' | 'published';
  published_at: Date | null;
  author_id: string | null;
  new_author_id: string | null;
  featured_media_id: string | null;
  page_type: string | null;
  content_type_key: string | null;
  ai_job_id: string | null;
  // SEO fields
  seo_title: string | null;
  seo_description: string | null;
  seo_canonical: string | null;
  seo_robots_index: boolean;
  seo_robots_follow: boolean;
  seo_focus_keyword: string | null;
  seo_og_title: string | null;
  seo_og_description: string | null;
  seo_og_image: string | null;
  seo_og_type: string;
  seo_twitter_title: string | null;
  seo_twitter_description: string | null;
  seo_twitter_image: string | null;
  seo_twitter_card: 'summary' | 'summary_large_image';
  seo_breadcrumb_title: string | null;
  seo_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface Term {
  id: string;
  site_id: string;
  type: 'category' | 'tag';
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  status: 'active' | 'inactive' | 'archived';
  // SEO fields
  seo_title: string | null;
  seo_description: string | null;
  seo_canonical: string | null;
  seo_robots_index: boolean;
  seo_robots_follow: boolean;
  seo_og_title: string | null;
  seo_og_description: string | null;
  seo_og_image: string | null;
  seo_twitter_title: string | null;
  seo_twitter_description: string | null;
  seo_twitter_image: string | null;
  seo_twitter_card: 'summary' | 'summary_large_image';
  created_at: Date;
  updated_at: Date;
}

export interface TermRelation {
  id: string;
  site_id: string;
  content_id: string;
  term_id: string;
  created_at: Date;
}

export interface Media {
  id: string;
  site_id: string;
  url: string;
  filename: string;
  storage_path: string;
  alt_text: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Menu {
  id: string;
  site_id: string;
  location: 'primary' | 'footer';
  items: MenuItem[];
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  label: string;
  url: string;
  children?: MenuItem[];
}

export interface ContentIdea {
  id: string;
  site_id: string;
  source: 'manual' | 'ai' | 'rss';
  title: string;
  angle: string | null;
  content_type_key: string;
  category_slug: string;
  status: 'new' | 'processing' | 'done' | 'error';
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AIJob {
  id: string;
  site_id: string;
  kind: 'article_generate' | 'content_rewrite' | 'seo_optimize' | 'enrich_categories' | 'enrich_authors' | 'enrich_pages' | 'generate_blueprint_template';
  input_json: Record<string, any>;
  output_json: Record<string, any> | null;
  status: 'pending' | 'running' | 'done' | 'error';
  error_code: string | null;
  error_message: string | null;
  retries: number;
  model_used: string | null;
  tokens_used: number | null;
  started_at: Date | null;
  finished_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SeoRedirect {
  id: string;
  site_id: string;
  source_path: string;
  destination_path: string;
  redirect_type: 301 | 302 | 307 | 308;
  is_active: boolean;
  hit_count: number;
  last_hit_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContentType {
  id: string;
  site_id: string;
  key: string;
  label: string;
  description: string | null;
  rules_json: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface SiteBlueprint {
  id: string;
  site_id: string;
  version: number;
  blueprint_json: Record<string, any>;
  notes: string | null;
  created_at: Date;
}

export interface SeoSettings {
  id: string;
  site_id: string;
  // Global config
  site_name: string | null;
  site_tagline: string | null;
  site_description: string | null;
  separator: '|' | '-' | '–' | '—' | '/' | '·';
  // Title templates
  title_template_post: string;
  title_template_page: string;
  title_template_category: string;
  title_template_tag: string;
  title_template_home: string;
  // Default meta
  default_og_image: string | null;
  default_twitter_card: 'summary' | 'summary_large_image';
  // Social
  twitter_username: string | null;
  facebook_app_id: string | null;
  // Organization
  organization_name: string | null;
  organization_logo: string | null;
  // Locale
  default_locale: string;
  // Sitemap
  sitemap_posts_priority: number;
  sitemap_posts_changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  sitemap_pages_priority: number;
  sitemap_pages_changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  // Robots.txt
  custom_robots_txt: string | null;
  // Schema.org / JSON-LD
  schema_article_type: 'Article' | 'NewsArticle' | 'BlogPosting' | 'TechArticle' | 'ScholarlyArticle';
  schema_enable_organization: boolean;
  schema_enable_website: boolean;
  schema_enable_breadcrumbs: boolean;
  created_at: Date;
  updated_at: Date;
}
