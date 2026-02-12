import { getSupabaseAdmin } from '@/lib/db/client';

// ====================================
// Safe Reset Site Structure
// ====================================

export interface ResetSiteStructureResult {
  allowed: boolean;
  reason?: string;
  deleted?: {
    categories: number;
    authors: number;
    pages: number;
    contentTypes: number;
    seoMeta: number;
  };
}

/**
 * Safely reset site structure (categories, authors, pages, content types)
 * ONLY allowed if site has 0 published content
 */
export async function resetSiteStructure(
  siteId: string
): Promise<ResetSiteStructureResult> {
  const supabase = getSupabaseAdmin();

  // 1. Check if site has any published content
  const { count: publishedCount, error: countError } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('type', 'post')
    .eq('status', 'published');

  if (countError) {
    throw new Error(`Failed to check published content: ${countError.message}`);
  }

  // Safety check: DO NOT allow reset if there's published content
  if (publishedCount && publishedCount > 0) {
    return {
      allowed: false,
      reason: `Site has ${publishedCount} published article(s). Reset is not allowed.`,
    };
  }

  const deleted = {
    categories: 0,
    authors: 0,
    pages: 0,
    contentTypes: 0,
    seoMeta: 0,
  };

  // 2. Delete categories (terms where type='category')
  // Get IDs first for SEO cleanup
  const { data: categories } = await supabase
    .from('terms')
    .select('id')
    .eq('site_id', siteId)
    .eq('type', 'category');

  if (categories && categories.length > 0) {
    const categoryIds = categories.map((c) => c.id);

    // Delete associated SEO meta
    await supabase
      .from('seo_meta')
      .delete()
      .eq('entity_type', 'term')
      .in('entity_id', categoryIds);

    // Delete categories
    const { error: deleteTermsError } = await supabase
      .from('terms')
      .delete()
      .eq('site_id', siteId)
      .eq('type', 'category');

    if (!deleteTermsError) {
      deleted.categories = categories.length;
      deleted.seoMeta += categories.length;
    }
  }

  // 3. Delete authors
  const { data: authors } = await supabase
    .from('authors')
    .select('id')
    .eq('site_id', siteId);

  if (authors && authors.length > 0) {
    const authorIds = authors.map((a) => a.id);

    // Delete associated SEO meta
    await supabase
      .from('seo_meta')
      .delete()
      .eq('entity_type', 'author')
      .in('entity_id', authorIds);

    // Delete authors
    const { error: deleteAuthorsError } = await supabase
      .from('authors')
      .delete()
      .eq('site_id', siteId);

    if (!deleteAuthorsError) {
      deleted.authors = authors.length;
      deleted.seoMeta += authors.length;
    }
  }

  // 4. Delete pages (content where type='page')
  const { data: pages } = await supabase
    .from('content')
    .select('id')
    .eq('site_id', siteId)
    .eq('type', 'page');

  if (pages && pages.length > 0) {
    const pageIds = pages.map((p) => p.id);

    // Delete associated SEO meta
    await supabase
      .from('seo_meta')
      .delete()
      .eq('entity_type', 'content')
      .in('entity_id', pageIds);

    // Delete pages
    const { error: deletePagesError } = await supabase
      .from('content')
      .delete()
      .eq('site_id', siteId)
      .eq('type', 'page');

    if (!deletePagesError) {
      deleted.pages = pages.length;
      deleted.seoMeta += pages.length;
    }
  }

  // 5. Delete content types
  const { count: contentTypesCount, error: ctCountError } = await supabase
    .from('content_types')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId);

  if (!ctCountError && contentTypesCount) {
    const { error: deleteCtError } = await supabase
      .from('content_types')
      .delete()
      .eq('site_id', siteId);

    if (!deleteCtError) {
      deleted.contentTypes = contentTypesCount;
    }
  }

  // 6. Reset sites.active_blueprint_version to null (optional)
  await supabase
    .from('sites')
    .update({ 
      active_blueprint_version: null,
      setup_status: 'draft',
    })
    .eq('id', siteId);

  return {
    allowed: true,
    deleted,
  };
}

/**
 * Check if a site can be safely reset
 * Returns published content count
 */
export async function canResetSiteStructure(siteId: string): Promise<{
  canReset: boolean;
  publishedCount: number;
  reason?: string;
}> {
  const supabase = getSupabaseAdmin();

  const { count: publishedCount, error } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('type', 'post')
    .eq('status', 'published');

  if (error) {
    throw new Error(`Failed to check published content: ${error.message}`);
  }

  const canReset = !publishedCount || publishedCount === 0;

  return {
    canReset,
    publishedCount: publishedCount || 0,
    reason: canReset
      ? undefined
      : `Site has ${publishedCount} published article(s). Reset is not allowed.`,
  };
}
