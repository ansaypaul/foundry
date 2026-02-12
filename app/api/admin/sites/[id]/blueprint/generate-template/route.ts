import { NextRequest, NextResponse } from 'next/server';
import { generateBlueprintTemplateV1 } from '@/lib/services/ai/generateBlueprintTemplate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST: Generate blueprint template with AI and persist to site_blueprint
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    const result = await generateBlueprintTemplateV1(siteId);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      blueprintId: result.blueprintId,
      version: result.version,
      template: result.template,
    });
  } catch (error) {
    console.error('Error generating blueprint template:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la génération du blueprint',
      },
      { status: 500 }
    );
  }
}
