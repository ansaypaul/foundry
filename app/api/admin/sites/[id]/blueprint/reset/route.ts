import { NextRequest, NextResponse } from 'next/server';
import { resetSiteStructure, canResetSiteStructure } from '@/lib/services/setup/resetSiteStructure';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET: Check if site can be reset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    const result = await canResetSiteStructure(siteId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking reset eligibility:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la vérification',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Reset site structure (ONLY if no published content)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    const result = await resetSiteStructure(siteId);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: result.reason || 'Reset not allowed',
          allowed: false,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error('Error resetting site structure:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors du reset',
      },
      { status: 500 }
    );
  }
}
