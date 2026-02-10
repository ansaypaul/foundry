/**
 * SEO Core - Database Queries
 * Requêtes BDD pour récupérer les settings et données SEO
 */

import { getSupabaseAdmin } from '@/lib/db/client';
import type { SeoSettings, SeoRedirect } from '@/lib/db/types';

// ===================================
// SEO SETTINGS
// ===================================

/**
 * Récupère les settings SEO d'un site
 */
export async function getSeoSettings(siteId: string): Promise<SeoSettings | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('seo_settings')
    .select('*')
    .eq('site_id', siteId)
    .single();
  
  if (error) {
    // PGRST116 = pas de résultat, c'est normal si settings pas encore créés
    if (error.code !== 'PGRST116') {
      console.error('[SEO] Error fetching settings:', error);
    }
    return null;
  }
  
  return data;
}

/**
 * Crée ou met à jour les settings SEO d'un site
 */
export async function upsertSeoSettings(
  siteId: string,
  settings: Partial<Omit<SeoSettings, 'id' | 'site_id' | 'created_at' | 'updated_at'>>
): Promise<SeoSettings | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('seo_settings')
    .upsert({
      site_id: siteId,
      ...settings,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[SEO] Error upserting settings:', error);
    return null;
  }
  
  return data;
}

// ===================================
// SEO REDIRECTS
// ===================================

/**
 * Récupère toutes les redirections actives d'un site
 */
export async function getActiveRedirects(siteId: string): Promise<SeoRedirect[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('seo_redirects')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[SEO] Error fetching redirects:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Trouve une redirection pour un chemin source
 */
export async function findRedirect(
  siteId: string,
  sourcePath: string
): Promise<SeoRedirect | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('seo_redirects')
    .select('*')
    .eq('site_id', siteId)
    .eq('source_path', sourcePath)
    .eq('is_active', true)
    .single();
  
  if (error) {
    // Not found is expected, don't log
    if (error.code !== 'PGRST116') {
      console.error('[SEO] Error finding redirect:', error);
    }
    return null;
  }
  
  return data;
}

/**
 * Incrémente le compteur de hits d'une redirection
 */
export async function incrementRedirectHit(redirectId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  await supabase.rpc('increment_redirect_hit', { redirect_id: redirectId });
}

/**
 * Crée une nouvelle redirection
 */
export async function createRedirect(
  siteId: string,
  sourcePath: string,
  destinationPath: string,
  redirectType: 301 | 302 | 307 | 308 = 301
): Promise<SeoRedirect | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('seo_redirects')
    .insert({
      site_id: siteId,
      source_path: sourcePath,
      destination_path: destinationPath,
      redirect_type: redirectType,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('[SEO] Error creating redirect:', error);
    return null;
  }
  
  return data;
}

/**
 * Supprime une redirection
 */
export async function deleteRedirect(redirectId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('seo_redirects')
    .delete()
    .eq('id', redirectId);
  
  if (error) {
    console.error('[SEO] Error deleting redirect:', error);
    return false;
  }
  
  return true;
}

/**
 * Active/désactive une redirection
 */
export async function toggleRedirect(
  redirectId: string,
  isActive: boolean
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('seo_redirects')
    .update({ is_active: isActive })
    .eq('id', redirectId);
  
  if (error) {
    console.error('[SEO] Error toggling redirect:', error);
    return false;
  }
  
  return true;
}

// ===================================
// SEO METADATA (Content & Terms)
// ===================================

/**
 * Met à jour les métadonnées SEO d'un content
 */
export async function updateContentSeo(
  contentId: string,
  seoData: {
    seo_title?: string | null;
    seo_description?: string | null;
    seo_canonical?: string | null;
    seo_robots_index?: boolean;
    seo_robots_follow?: boolean;
    seo_focus_keyword?: string | null;
    seo_og_title?: string | null;
    seo_og_description?: string | null;
    seo_og_image?: string | null;
    seo_twitter_title?: string | null;
    seo_twitter_description?: string | null;
    seo_twitter_image?: string | null;
    seo_twitter_card?: 'summary' | 'summary_large_image';
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('content')
    .update(seoData)
    .eq('id', contentId);
  
  if (error) {
    console.error('[SEO] Error updating content SEO:', error);
    return false;
  }
  
  return true;
}

/**
 * Met à jour les métadonnées SEO d'un term
 */
export async function updateTermSeo(
  termId: string,
  seoData: {
    seo_title?: string | null;
    seo_description?: string | null;
    seo_canonical?: string | null;
    seo_robots_index?: boolean;
    seo_robots_follow?: boolean;
    seo_og_title?: string | null;
    seo_og_description?: string | null;
    seo_og_image?: string | null;
    seo_twitter_title?: string | null;
    seo_twitter_description?: string | null;
    seo_twitter_image?: string | null;
    seo_twitter_card?: 'summary' | 'summary_large_image';
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('terms')
    .update(seoData)
    .eq('id', termId);
  
  if (error) {
    console.error('[SEO] Error updating term SEO:', error);
    return false;
  }
  
  return true;
}
