import { NextRequest, NextResponse } from 'next/server';
import {
  buildPageEnrichmentProposals,
} from '@/lib/services/ai/enrichPagesComplete';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Generate page enrichment proposals (preview)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const { pageIds, mode = 'fill_only_empty' } = body;

    const result = await buildPageEnrichmentProposals({
      siteId,
      pageIds: pageIds || [],
      mode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating page enrichment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erreur lors de la génération',
      },
      { status: 500 }
    );
  }
}
