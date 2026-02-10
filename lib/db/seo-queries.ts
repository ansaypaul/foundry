import { getSupabaseAdmin } from './client';

/**
 * Charge un content avec ses métadonnées SEO
 */
export async function getContentWithSeo(contentId: string) {
  const supabase = getSupabaseAdmin();
  
  // Charger le content
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .single();
  
  if (error || !content) {
    return null;
  }
  
  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'content')
    .eq('entity_id', contentId)
    .maybeSingle();
  
  // Merger en excluant les champs système de seo_meta
  if (seoMeta) {
    const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
    return {
      ...content,
      ...seoFields,
    };
  }
  
  return content;
}

/**
 * Charge un term avec ses métadonnées SEO
 */
export async function getTermWithSeo(termId: string) {
  const supabase = getSupabaseAdmin();
  
  // Charger le term
  const { data: term, error } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single();
  
  if (error || !term) {
    return null;
  }
  
  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'term')
    .eq('entity_id', termId)
    .maybeSingle();
  
  // Merger en excluant les champs système de seo_meta
  if (seoMeta) {
    const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
    return {
      ...term,
      ...seoFields,
    };
  }
  
  return term;
}

/**
 * Sauvegarde ou met à jour les métadonnées SEO d'une entité
 */
export async function upsertSeoMeta(
  entityType: 'content' | 'term' | 'site',
  entityId: string,
  seoData: {
    seo_title?: string | null;
    seo_description?: string | null;
    seo_focus_keyword?: string | null;
    seo_canonical?: string | null;
    seo_robots_index?: boolean;
    seo_robots_follow?: boolean;
    seo_og_title?: string | null;
    seo_og_description?: string | null;
    seo_og_image?: string | null;
    seo_og_type?: string | null;
    seo_twitter_title?: string | null;
    seo_twitter_description?: string | null;
    seo_twitter_image?: string | null;
    seo_twitter_card?: string | null;
    seo_breadcrumb_title?: string | null;
    seo_score?: number;
  }
) {
  const supabase = getSupabaseAdmin();
  
  // Upsert sans .single() car peut ne pas retourner de résultat
  const { data, error } = await supabase
    .from('seo_meta')
    .upsert({
      entity_type: entityType,
      entity_id: entityId,
      ...seoData,
    }, {
      onConflict: 'entity_type,entity_id'
    })
    .select();
  
  if (error) {
    console.error('Error upserting SEO meta:', error);
    throw error;
  }
  
  // Retourner le premier élément s'il existe
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Enrichit une liste de contents avec leurs métadonnées SEO
 */
export async function enrichContentsWithSeo(contents: any[]) {
  if (!contents || contents.length === 0) return [];
  
  const supabase = getSupabaseAdmin();
  const contentIds = contents.map(c => c.id);
  
  // Charger toutes les métadonnées SEO d'un coup
  const { data: seoMetas } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'content')
    .in('entity_id', contentIds);
  
  // Créer un map pour lookup rapide (en excluant les champs système)
  const seoMap = new Map(
    seoMetas?.map(s => {
      const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = s;
      return [entity_id, seoFields];
    }) || []
  );
  
  // Merger
  return contents.map(content => ({
    ...content,
    ...(seoMap.get(content.id) || {}),
  }));
}

/**
 * Charge un content par slug avec ses métadonnées SEO et l'auteur
 */
export async function getContentBySlugWithSeo(siteId: string, slug: string, type: 'post' | 'page') {
  const supabase = getSupabaseAdmin();
  
  // Charger le content avec l'auteur
  const { data: content, error } = await supabase
    .from('content')
    .select(`
      *,
      author:authors!content_new_author_id_fkey(id, display_name, slug, avatar_url, bio)
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('type', type)
    .eq('status', 'published')
    .single();
  
  if (error || !content) {
    return null;
  }
  
  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'content')
    .eq('entity_id', content.id)
    .maybeSingle();
  
  // Merger en excluant les champs système de seo_meta
  if (seoMeta) {
    const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
    return {
      ...content,
      ...seoFields,
    };
  }
  
  return content;
}
