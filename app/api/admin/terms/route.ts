import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    if (!siteId) {
      return NextResponse.json(
        { error: 'site_id est requis' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: terms } = await supabase
      .from('terms')
      .select('*')
      .eq('site_id', siteId)
      .order('name');

    return NextResponse.json({ terms: terms || [] });
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des termes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, type, name, slug, description } = body;

    // Validation
    if (!site_id || !type || !name || !slug) {
      return NextResponse.json(
        { error: 'site_id, type, name et slug sont requis' },
        { status: 400 }
      );
    }

    if (type !== 'category' && type !== 'tag') {
      return NextResponse.json(
        { error: 'Le type doit être "category" ou "tag"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Normaliser le slug
    const normalizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer le terme
    const { data, error } = await supabase
      .from('terms')
      .insert({
        site_id,
        type,
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ term: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating term:', error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà pour ce site et ce type' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la taxonomie' },
      { status: 500 }
    );
  }
}
