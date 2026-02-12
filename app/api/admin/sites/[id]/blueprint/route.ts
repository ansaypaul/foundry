import { NextRequest, NextResponse } from 'next/server';
import { buildSiteBlueprint, saveSiteBlueprint, listSiteBlueprints } from '@/lib/services/blueprint/buildSiteBlueprint';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Preview current blueprint
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Build blueprint from current state
    const blueprint = await buildSiteBlueprint(id);

    // Get existing versions count
    const versions = await listSiteBlueprints(id);

    return NextResponse.json({
      blueprint,
      existingVersions: versions.length,
      nextVersion: versions.length + 1,
    });
  } catch (error) {
    console.error('Error building blueprint:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du blueprint' },
      { status: 500 }
    );
  }
}

// POST: Save blueprint as new version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    // Build blueprint from current state
    const blueprint = await buildSiteBlueprint(id);

    // Save to database
    const saved = await saveSiteBlueprint(id, blueprint, notes);

    return NextResponse.json({
      message: `Blueprint v${saved.version} enregistré avec succès`,
      version: saved.version,
      blueprintId: saved.id,
    });
  } catch (error) {
    console.error('Error saving blueprint:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du blueprint' },
      { status: 500 }
    );
  }
}
