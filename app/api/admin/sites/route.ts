import { NextRequest, NextResponse } from 'next/server';
import { createSite, getAllSites } from '@/lib/db/queries';

export async function GET() {
  try {
    const sites = await getAllSites();
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, theme_key = 'default', status = 'active' } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du site est requis' },
        { status: 400 }
      );
    }

    // Créer le site
    const site = await createSite({
      name: name.trim(),
      theme_key,
      status,
      theme_config: {},
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du site' },
      { status: 500 }
    );
  }
}
