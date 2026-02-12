import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';
import { generateArticleFromIdea } from '@/lib/services/ai/generateArticleFromIdea';
import { isOpenAIConfigured } from '@/lib/services/ai/openaiClient';
import { generateSlug } from '@/lib/utils/slug';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Select best author for content type
 */
async function selectAuthor(args: {
  siteId: string;
  preferredRoleKeys?: string[];
}): Promise<any | null> {
  const { siteId, preferredRoleKeys = [] } = args;
  const supabase = getSupabaseAdmin();

  // Try preferred roles first
  if (preferredRoleKeys.length > 0) {
    for (const roleKey of preferredRoleKeys) {
      const { data } = await supabase
        .from('authors')
        .select('*')
        .eq('site_id', siteId)
        .eq('role_key', roleKey)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (data) return data;
    }
  }

  // Fallback: editorial_lead
  const { data: editorialLead } = await supabase
    .from('authors')
    .select('*')
    .eq('site_id', siteId)
    .eq('role_key', 'editorial_lead')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (editorialLead) return editorialLead;

  // Last resort: any active author
  const { data: anyAuthor } = await supabase
    .from('authors')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .limit(1)
    .single();

  return anyAuthor || null;
}

// POST: Generate article with AI
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    // Check OpenAI configuration
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error: 'OpenAI n\'est pas configuré. Veuillez ajouter OPENAI_API_KEY dans votre fichier .env',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { title, angle, contentTypeKey, categorySlug } = body;

    // Validation
    if (!title || !contentTypeKey || !categorySlug) {
      return NextResponse.json(
        { error: 'Champs requis manquants (title, contentTypeKey, categorySlug)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get site
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json({ error: 'Site introuvable' }, { status: 404 });
    }

    // Get content type
    const { data: contentType, error: contentTypeError } = await supabase
      .from('content_types')
      .select('*')
      .eq('site_id', siteId)
      .eq('key', contentTypeKey)
      .eq('status', 'active')
      .single();

    if (contentTypeError || !contentType) {
      return NextResponse.json(
        { error: 'Type de contenu introuvable' },
        { status: 404 }
      );
    }

    // 🔍 DEBUG: Log blueprint rules
    console.log('🔍 [BLUEPRINT DEBUG] Content Type loaded:', {
      key: contentType.key,
      label: contentType.label,
      rules_json_type: typeof contentType.rules_json,
      rules_json_keys: contentType.rules_json ? Object.keys(contentType.rules_json) : 'NULL',
      rules_json_full: JSON.stringify(contentType.rules_json, null, 2),
    });

    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('terms')
      .select('*')
      .eq('site_id', siteId)
      .eq('slug', categorySlug)
      .eq('type', 'category')
      .eq('status', 'active')
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Catégorie introuvable' },
        { status: 404 }
      );
    }

    // Select author
    const preferredRoleKeys =
      contentType.rules_json?.defaults?.preferred_author_role_keys || [];
    const author = await selectAuthor({ siteId, preferredRoleKeys });

    if (!author) {
      return NextResponse.json(
        { error: 'Aucun auteur actif trouvé pour ce site' },
        { status: 400 }
      );
    }

    // Create content_idea record
    const { data: ideaRecord, error: ideaError } = await supabase
      .from('content_idea')
      .insert({
        site_id: siteId,
        source: 'manual',
        title,
        angle,
        content_type_key: contentTypeKey,
        category_slug: categorySlug,
        status: 'processing',
      })
      .select()
      .single();

    if (ideaError || !ideaRecord) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'idée' },
        { status: 500 }
      );
    }

    // Create AI job
    const { data: aiJob, error: aiJobError } = await supabase
      .from('ai_job')
      .insert({
        site_id: siteId,
        kind: 'article_generate',
        status: 'running',
        started_at: new Date().toISOString(),
        model_used: 'gpt-4o-mini',
        input_json: {
          idea_id: ideaRecord.id,
          title,
          angle,
          content_type_key: contentTypeKey,
          category_slug: categorySlug,
          category_name: category.name,
          author_id: author.id,
          author_name: author.display_name,
          site: {
            name: site.name,
            language: site.language,
            country: site.country,
          },
          contentType: {
            key: contentType.key,
            label: contentType.label,
          },
        },
      })
      .select()
      .single();

    if (aiJobError || !aiJob) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du job AI' },
        { status: 500 }
      );
    }

    try {
      // Generate article
      const result = await generateArticleFromIdea({
        site: {
          name: site.name,
          language: site.language,
          country: site.country,
          description: site.description,
        },
        idea: {
          title,
          angle,
        },
        contentType: {
          key: contentType.key,
          label: contentType.label,
          rulesJson: contentType.rules_json,
        },
        category: {
          name: category.name,
          slug: category.slug,
        },
        author: {
          id: author.id,
          roleKey: author.role_key || 'writer',
          displayName: author.display_name,
          specialties: author.specialties || [],
        },
      });

      // Generate unique slug
      const baseSlug = generateSlug(result.title);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const { data: existing } = await supabase
          .from('content')
          .select('id')
          .eq('site_id', siteId)
          .eq('slug', slug)
          .single();

        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create article as draft
      const { data: article, error: articleError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          type: 'post',
          slug,
          title: result.title,
          content_html: result.contentHtml,
          content_type_key: contentTypeKey,
          new_author_id: author.id,
          status: 'draft',
          ai_job_id: aiJob.id,
        })
        .select()
        .single();

      if (articleError || !article) {
        console.error('Article creation error:', articleError);
        throw new Error(`Erreur lors de la création de l'article: ${articleError?.message || 'Unknown error'}`);
      }

      // Link category
      await supabase.from('term_relations').insert({
        site_id: siteId,
        content_id: article.id,
        term_id: category.id,
      });

      // Update AI job to done
      await supabase
        .from('ai_job')
        .update({
          status: 'done',
          retries: result.attempts.length - 1,
          output_json: {
            summary: {
              articleId: article.id,
              articleSlug: article.slug,
              articleTitle: article.title,
              stats: result.stats,
              validationErrors: [],
            },
            attempts: result.attempts,
          },
          finished_at: new Date().toISOString(),
        })
        .eq('id', aiJob.id);

      // Update content_idea to done
      await supabase
        .from('content_idea')
        .update({ status: 'done' })
        .eq('id', ideaRecord.id);

      return NextResponse.json({
        success: true,
        article: {
          id: article.id,
          slug: article.slug,
          title: article.title,
        },
        stats: result.stats,
      });
    } catch (generationError) {
      const errorMessage = generationError instanceof Error 
        ? generationError.message 
        : 'Unknown error';
      
      // Determine error code
      let errorCode = 'UNKNOWN_ERROR';
      if (errorMessage.includes('Validation failed')) {
        errorCode = 'VALIDATION_FAILED';
      } else if (errorMessage.includes('OpenAI')) {
        errorCode = 'OPENAI_ERROR';
      } else if (errorMessage.includes('création de l\'article')) {
        errorCode = 'DB_INSERT_ERROR';
      }

      // Update AI job to error
      await supabase
        .from('ai_job')
        .update({
          status: 'error',
          error_code: errorCode,
          error_message: errorMessage,
          finished_at: new Date().toISOString(),
        })
        .eq('id', aiJob.id);

      // Update content_idea to error
      await supabase
        .from('content_idea')
        .update({ status: 'error' })
        .eq('id', ideaRecord.id);

      throw generationError;
    }
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération de l\'article',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
