import { getSupabaseAdmin } from '@/lib/db/client';
import { validateArticleContent, getContentTypeRules } from './articleValidator';

export interface CreateArticleInput {
  siteId: string;
  title: string;
  contentHtml: string;
  contentTypeKey: string;
  authorId: string; // from authors table (new_author_id)
  categoryId?: string;
  status: 'draft' | 'published';
  excerpt?: string;
}

export interface CreateArticleResult {
  success: boolean;
  articleId?: string;
  slug?: string;
  validationErrors?: Array<{ code: string; message: string }>;
  error?: string;
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
    .replace(/^-|-$/g, ''); // Remove leading/trailing -
}

/**
 * Ensure slug is unique for the site
 */
async function ensureUniqueSlug(siteId: string, baseSlug: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from('content')
      .select('id')
      .eq('site_id', siteId)
      .eq('type', 'post')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Slug is unique
      return slug;
    }

    // Slug exists, try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create article
 */
export async function createArticle(input: CreateArticleInput): Promise<CreateArticleResult> {
  const supabase = getSupabaseAdmin();

  try {
    // 1. Get content type rules
    const rules = await getContentTypeRules(input.siteId, input.contentTypeKey);
    
    if (!rules) {
      return {
        success: false,
        error: 'Type de contenu introuvable',
      };
    }

    // 2. Validate content (only for publish, allow draft without validation)
    if (input.status === 'published') {
      const validation = validateArticleContent({
        html: input.contentHtml,
        contentTypeRules: rules,
      });

      if (!validation.valid) {
        return {
          success: false,
          validationErrors: validation.errors,
        };
      }
    }

    // 3. Generate unique slug
    const baseSlug = generateSlug(input.title);
    const slug = await ensureUniqueSlug(input.siteId, baseSlug);

    // 4. Create article
    const articleData: any = {
      site_id: input.siteId,
      type: 'post',
      title: input.title,
      slug,
      content_html: input.contentHtml,
      content_type_key: input.contentTypeKey,
      new_author_id: input.authorId, // Use new_author_id column
      status: input.status,
      excerpt: input.excerpt || null,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    };

    const { data: article, error } = await supabase
      .from('content')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 5. Add category relation if provided
    if (input.categoryId && article) {
      await supabase
        .from('term_relations')
        .insert({
          site_id: input.siteId,
          content_id: article.id,
          term_id: input.categoryId,
        });
    }

    return {
      success: true,
      articleId: article.id,
      slug: article.slug,
    };
  } catch (error) {
    console.error('Error creating article:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}
