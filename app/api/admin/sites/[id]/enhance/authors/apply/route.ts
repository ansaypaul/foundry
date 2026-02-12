import { NextRequest, NextResponse } from 'next/server';
import { applyAuthorEnrichment } from '@/lib/services/ai/enrichAuthorsComplete';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Apply author enrichment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const { aiJobId, selectedProposals, mode = 'fill_only_empty' } = body;

    if (!aiJobId || !selectedProposals || selectedProposals.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await applyAuthorEnrichment(
      siteId,
      aiJobId,
      selectedProposals,
      mode
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error applying author enrichment:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de l\'application',
      },
      { status: 500 }
    );
  }
}
