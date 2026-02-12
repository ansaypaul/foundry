import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { buildCategoryEnrichmentProposals, applyCategoryEnrichment } from '@/lib/services/ai/enrichCategoriesComplete';
import { buildAuthorEnrichmentProposals, applyAuthorEnrichment } from '@/lib/services/ai/enrichAuthorsComplete';
import { buildPageEnrichmentProposals, applyPageEnrichment } from '@/lib/services/ai/enrichPagesComplete';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST: Run all enrichment steps in sequence
 * Categories → Authors → Pages
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();
    const { mode = 'fill_only_empty' } = body;

    const supabase = getSupabaseAdmin();
    const results = {
      categories: { success: false, jobId: null as string | null, error: null as string | null },
      authors: { success: false, jobId: null as string | null, error: null as string | null },
      pages: { success: false, jobId: null as string | null, error: null as string | null },
    };

    // 1. Enrich Categories
    try {
      const categoryResult = await buildCategoryEnrichmentProposals({
        siteId,
        categoryIds: [], // All categories
        mode,
      });

      // Auto-apply all proposals
      if (categoryResult.proposals.length > 0) {
        await applyCategoryEnrichment(
          siteId,
          categoryResult.aiJobId,
          categoryResult.proposals,
          mode
        );
      }

      results.categories.success = true;
      results.categories.jobId = categoryResult.aiJobId;
    } catch (error) {
      results.categories.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 2. Enrich Authors
    try {
      const authorResult = await buildAuthorEnrichmentProposals({
        siteId,
        authorIds: [], // All authors
        mode,
      });

      // Auto-apply all proposals
      if (authorResult.proposals.length > 0) {
        await applyAuthorEnrichment(
          siteId,
          authorResult.aiJobId,
          authorResult.proposals,
          mode
        );
      }

      results.authors.success = true;
      results.authors.jobId = authorResult.aiJobId;
    } catch (error) {
      results.authors.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 3. Enrich Pages
    try {
      const pageResult = await buildPageEnrichmentProposals({
        siteId,
        pageIds: [], // All essential pages
        mode,
      });

      // Auto-apply all proposals
      if (pageResult.proposals.length > 0) {
        await applyPageEnrichment(
          siteId,
          pageResult.aiJobId,
          pageResult.proposals,
          mode
        );
      }

      results.pages.success = true;
      results.pages.jobId = pageResult.aiJobId;
    } catch (error) {
      results.pages.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 4. Update site status to 'enriched' if all succeeded
    const allSucceeded = results.categories.success && results.authors.success && results.pages.success;

    if (allSucceeded) {
      await supabase
        .from('sites')
        .update({ setup_status: 'enriched' })
        .eq('id', siteId);
    }

    return NextResponse.json({
      success: allSucceeded,
      results,
      message: allSucceeded
        ? 'Enrichissement complet terminé avec succès'
        : 'Enrichissement partiel: certaines étapes ont échoué',
    });
  } catch (error) {
    console.error('Error running full enrichment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de l\'enrichissement',
      },
      { status: 500 }
    );
  }
}
