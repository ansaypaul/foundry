// Database types

export interface Site {
  id: string;
  name: string;
  theme_key: string;
  theme_id: string | null;
  theme_config: Record<string, any>;
  status: 'active' | 'paused';
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
  featured_media_id: string | null;
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

export interface AIJob {
  id: string;
  site_id: string | null;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  prompt_version: string | null;
  error_message: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}
