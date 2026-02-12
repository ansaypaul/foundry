import { NextRequest, NextResponse } from 'next/server';
import {
  buildCategoryEnrichmentProposals,
  applyCategoryEnrichment,
} from '@/lib/services/ai/enrichCategoriesComplete';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Generate category enrichment proposals (preview)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const { categoryIds, mode = 'fill_only_empty' } = body;

    const result = await buildCategoryEnrichmentProposals({
      siteId,
      categoryIds: categoryIds || [],
      mode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating category enrichment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur lors de la génération',
      },
      { status: 500 }
    );
  }
}
