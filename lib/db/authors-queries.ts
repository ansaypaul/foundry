import { getSupabaseAdmin } from './client';
import type { Author } from './types';

/**
 * Récupère tous les auteurs d'un site
 */
export async function getAuthorsBySiteId(siteId: string): Promise<Author[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('site_id', siteId)
    .order('display_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Récupère un auteur par son ID
 */
export async function getAuthorById(authorId: string): Promise<Author | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('id', authorId)
    .single();
  
  if (error) {
    console.error('Error fetching author:', error);
    return null;
  }
  
  return data;
}

/**
 * Récupère un auteur par son slug
 */
export async function getAuthorBySlug(
  siteId: string,
  slug: string
): Promise<Author | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error('Error fetching author by slug:', error);
    return null;
  }
  
  return data;
}

/**
 * Récupère les auteurs avec le nombre d'articles
 */
export async function getAuthorsWithPostCount(siteId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('site_id', siteId)
    .gt('posts_count', 0)
    .order('posts_count', { ascending: false });
  
  if (error) {
    console.error('Error fetching authors with post count:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Crée un nouvel auteur
 */
export async function createAuthor(author: {
  site_id: string;
  user_id?: string | null;
  slug: string;
  display_name: string;
  email?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website_url?: string | null;
  twitter_username?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  instagram_username?: string | null;
  github_username?: string | null;
}): Promise<Author | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .insert(author)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating author:', error);
    throw error;
  }
  
  return data;
}

/**
 * Met à jour un auteur
 */
export async function updateAuthor(
  authorId: string,
  updates: Partial<Omit<Author, 'id' | 'site_id' | 'created_at' | 'updated_at' | 'posts_count'>>
): Promise<Author | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .update(updates)
    .eq('id', authorId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating author:', error);
    throw error;
  }
  
  return data;
}

/**
 * Supprime un auteur
 */
export async function deleteAuthor(authorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('authors')
    .delete()
    .eq('id', authorId);
  
  if (error) {
    console.error('Error deleting author:', error);
    return false;
  }
  
  return true;
}

/**
 * Récupère l'auteur lié à un user sur un site spécifique
 */
export async function getAuthorByUserAndSite(
  userId: string,
  siteId: string
): Promise<Author | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .single();
  
  if (error) {
    console.error('Error fetching author by user and site:', error);
    return null;
  }
  
  return data;
}

/**
 * Génère un slug unique pour un auteur
 */
export async function generateUniqueAuthorSlug(
  siteId: string,
  baseName: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  // Générer le slug de base
  let slug = baseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Vérifier l'unicité
  let finalSlug = slug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('authors')
      .select('id')
      .eq('site_id', siteId)
      .eq('slug', finalSlug)
      .single();
    
    if (!data) {
      // Slug disponible
      break;
    }
    
    // Slug existe, essayer avec un suffixe
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
}
