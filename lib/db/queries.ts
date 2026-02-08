import { getSupabaseAdmin } from './client';
import { Site, Domain, Content } from './types';

/**
 * Site queries using Supabase query builder
 */

export async function getAllSites(): Promise<Site[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any[]) as Site[];
}

export async function getSiteById(id: string): Promise<Site | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Site;
}

export async function createSite(site: {
  name: string;
  theme_key?: string;
  theme_config?: Record<string, any>;
  status?: 'active' | 'paused';
}): Promise<Site> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .insert(site as any)
    .select()
    .single();

  if (error) throw error;
  return data as Site;
}

export async function updateSite(id: string, updates: Partial<Site>): Promise<Site> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Site;
}

/**
 * Domain queries
 */

export async function getDomainByHostname(hostname: string): Promise<(Domain & { site: Site }) | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('domains')
    .select(`
      *,
      site:sites(*)
    `)
    .eq('hostname', hostname)
    .eq('site.status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data as any;
}

export async function getDomainsBySiteId(siteId: string): Promise<Domain[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('site_id', siteId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return (data as any[]) as Domain[];
}

export async function getPrimaryDomainBySiteId(siteId: string): Promise<Domain | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_primary', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Domain;
}

export async function createDomain(domain: {
  site_id: string;
  hostname: string;
  is_primary?: boolean;
  redirect_to_primary?: boolean;
}): Promise<Domain> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('domains')
    .insert(domain as any)
    .select()
    .single();

  if (error) throw error;
  return data as Domain;
}

/**
 * Content queries
 */

export async function getPublishedPostsBySiteId(siteId: string, limit: number = 10): Promise<Content[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('type', 'post')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as any[]) as Content[];
}

export async function getContentBySlug(siteId: string, slug: string, type: 'post' | 'page'): Promise<Content | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('type', type)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Content;
}

export async function getAllContentBySiteId(siteId: string): Promise<Content[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .order('updated_at', { ascending: false});

  if (error) throw error;
  return (data as any[]) as Content[];
}

export async function createContent(content: {
  site_id: string;
  type: 'post' | 'page';
  slug: string;
  title: string;
  excerpt?: string;
  content_html?: string;
  status?: 'draft' | 'published';
  author_id?: string;
  published_at?: string;
}): Promise<Content> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('content')
    .insert(content as any)
    .select()
    .single();

  if (error) throw error;
  return data as Content;
}

/**
 * Stats queries
 */

export async function getContentStats() {
  const supabase = getSupabaseAdmin();
  
  // Get total posts
  const { count: totalPosts } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'post');

  // Get total pages
  const { count: totalPages } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'page');

  // Get published posts
  const { count: publishedPosts } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'post')
    .eq('status', 'published');

  return {
    totalPosts: totalPosts || 0,
    totalPages: totalPages || 0,
    publishedPosts: publishedPosts || 0,
  };
}

/**
 * Term queries
 */

export async function getTermsBySiteId(siteId: string, type?: 'category' | 'tag') {
  const supabase = getSupabaseAdmin();
  
  let query = supabase
    .from('terms')
    .select('*')
    .eq('site_id', siteId)
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as any[]) || [];
}

export async function getTermBySlug(siteId: string, slug: string, type: 'category' | 'tag') {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('type', type)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getContentByTermId(termId: string, limit: number = 50): Promise<Content[]> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('term_relations')
    .select(`
      content:content(*)
    `)
    .eq('term_id', termId)
    .limit(limit);

  if (error) throw error;
  
  // Flatten la structure et filtrer les contenus publiés
  const contents = (data || [])
    .map((item: any) => item.content)
    .filter((c: any) => c && c.status === 'published');
  
  return contents as Content[];
}

/**
 * Content-Term relations
 */

export async function getTermsByContentId(contentId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('term_relations')
    .select(`
      term:terms(*)
    `)
    .eq('content_id', contentId);

  if (error) throw error;
  
  return (data || []).map((item: any) => item.term);
}

export async function setContentTerms(contentId: string, siteId: string, termIds: string[]) {
  const supabase = getSupabaseAdmin();
  
  // Supprimer les anciennes relations
  await supabase
    .from('term_relations')
    .delete()
    .eq('content_id', contentId);

  // Ajouter les nouvelles relations
  if (termIds.length > 0) {
    const relations = termIds.map(termId => ({
      site_id: siteId,
      content_id: contentId,
      term_id: termId,
    }));

    const { error } = await supabase
      .from('term_relations')
      .insert(relations as any);

    if (error) throw error;
  }
}
