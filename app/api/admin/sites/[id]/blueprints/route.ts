import { NextRequest, NextResponse } from 'next/server';
import { listSiteBlueprints } from '@/lib/services/blueprint/buildSiteBlueprint';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: List all blueprints for a site
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const blueprints = await listSiteBlueprints(id);

    return NextResponse.json({ blueprints });
  } catch (error) {
    console.error('Error listing blueprints:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des blueprints' },
      { status: 500 }
    );
  }
}
