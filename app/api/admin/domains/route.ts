import { NextRequest, NextResponse } from 'next/server';
import { createDomain } from '@/lib/db/queries';
import { normalizeHostname } from '@/lib/core/site-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, hostname, is_primary = false } = body;

    // Validation
    if (!site_id || !hostname) {
      return NextResponse.json(
        { error: 'site_id et hostname sont requis' },
        { status: 400 }
      );
    }

    // Normaliser le hostname
    const normalizedHostname = normalizeHostname(hostname);

    // Créer le domaine
    const domain = await createDomain({
      site_id,
      hostname: normalizedHostname,
      is_primary,
      redirect_to_primary: false,
    });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating domain:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ce domaine existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du domaine' },
      { status: 500 }
    );
  }
}
