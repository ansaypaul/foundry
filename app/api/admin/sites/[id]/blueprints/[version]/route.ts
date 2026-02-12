import { NextRequest, NextResponse } from 'next/server';
import { getBlueprintByVersion } from '@/lib/services/blueprint/buildSiteBlueprint';

interface RouteParams {
  params: Promise<{ id: string; version: string }>;
}

// GET: Get specific blueprint version
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, version } = await params;
    const versionNum = parseInt(version, 10);

    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: 'Version invalide' },
        { status: 400 }
      );
    }

    const blueprint = await getBlueprintByVersion(id, versionNum);

    if (!blueprint) {
      return NextResponse.json(
        { error: 'Blueprint non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ blueprint });
  } catch (error) {
    console.error('Error loading blueprint:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du blueprint' },
      { status: 500 }
    );
  }
}
