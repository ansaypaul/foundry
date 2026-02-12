import { NextRequest, NextResponse } from 'next/server';
import {
  buildAuthorEnrichmentProposals,
  applyAuthorEnrichment,
} from '@/lib/services/ai/enrichAuthorsComplete';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Generate author enrichment proposals (preview)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const { authorIds, mode = 'fill_only_empty' } = body;

    const result = await buildAuthorEnrichmentProposals({
      siteId,
      authorIds: authorIds || [],
      mode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating author enrichment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur lors de la génération',
      },
      { status: 500 }
    );
  }
}
