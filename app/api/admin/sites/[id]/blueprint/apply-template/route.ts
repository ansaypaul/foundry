import { NextRequest, NextResponse } from 'next/server';
import { applyBlueprintTemplate } from '@/lib/services/setup/applyBlueprintTemplate';
import { validateBlueprintTemplate } from '@/lib/services/blueprint/blueprintTemplateSchema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST: Apply blueprint template from site_blueprint table
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const { version } = body; // Optional: specific version to apply

    // Apply template from site_blueprint table
    const result = await applyBlueprintTemplate(siteId, version);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error applying blueprint template:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de l\'application du blueprint',
      },
      { status: 500 }
    );
  }
}
