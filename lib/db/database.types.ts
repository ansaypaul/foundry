// Database types generated from Supabase schema
// You can regenerate these with: npx supabase gen types typescript --project-id <project-id> > lib/db/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string
          name: string
          theme_key: string
          theme_config: Json
          status: 'active' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          theme_key?: string
          theme_config?: Json
          status?: 'active' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          theme_key?: string
          theme_config?: Json
          status?: 'active' | 'paused'
          created_at?: string
          updated_at?: string
        }
      }
      domains: {
        Row: {
          id: string
          site_id: string
          hostname: string
          is_primary: boolean
          redirect_to_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          hostname: string
          is_primary?: boolean
          redirect_to_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          hostname?: string
          is_primary?: boolean
          redirect_to_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          site_id: string
          role: 'admin' | 'editor' | 'author'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          site_id: string
          role: 'admin' | 'editor' | 'author'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          site_id?: string
          role?: 'admin' | 'editor' | 'author'
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          site_id: string
          type: 'post' | 'page'
          slug: string
          title: string
          excerpt: string | null
          content_html: string | null
          status: 'draft' | 'published'
          published_at: string | null
          author_id: string | null
          featured_media_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          type: 'post' | 'page'
          slug: string
          title: string
          excerpt?: string | null
          content_html?: string | null
          status?: 'draft' | 'published'
          published_at?: string | null
          author_id?: string | null
          featured_media_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          type?: 'post' | 'page'
          slug?: string
          title?: string
          excerpt?: string | null
          content_html?: string | null
          status?: 'draft' | 'published'
          published_at?: string | null
          author_id?: string | null
          featured_media_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      terms: {
        Row: {
          id: string
          site_id: string
          type: 'category' | 'tag'
          slug: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          type: 'category' | 'tag'
          slug: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          type?: 'category' | 'tag'
          slug?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      term_relations: {
        Row: {
          id: string
          site_id: string
          content_id: string
          term_id: string
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          content_id: string
          term_id: string
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          content_id?: string
          term_id?: string
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          site_id: string
          url: string
          alt: string | null
          width: number | null
          height: number | null
          mime_type: string | null
          file_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          url: string
          alt?: string | null
          width?: number | null
          height?: number | null
          mime_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          url?: string
          alt?: string | null
          width?: number | null
          height?: number | null
          mime_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      menus: {
        Row: {
          id: string
          site_id: string
          location: 'primary' | 'footer'
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          location: 'primary' | 'footer'
          items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          location?: 'primary' | 'footer'
          items?: Json
          created_at?: string
          updated_at?: string
        }
      }
      ai_jobs: {
        Row: {
          id: string
          site_id: string | null
          type: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          input_data: Json | null
          output_data: Json | null
          prompt_version: string | null
          error_message: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          site_id?: string | null
          type: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          input_data?: Json | null
          output_data?: Json | null
          prompt_version?: string | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          site_id?: string | null
          type?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          input_data?: Json | null
          output_data?: Json | null
          prompt_version?: string | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
