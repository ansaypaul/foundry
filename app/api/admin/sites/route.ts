import { NextRequest, NextResponse } from 'next/server';
import { createSite, getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';

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
    const { name, theme_id = null, status = 'active' } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du site est requis' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // Créer le site
    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        name: name.trim(),
        theme_id,
        status,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du site' },
      { status: 500 }
    );
  }
}
