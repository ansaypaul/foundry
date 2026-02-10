import { NextRequest, NextResponse } from 'next/server';
import { createContent } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const type = searchParams.get('type');
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'site_id est requis' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('content')
      .select('id, title, slug, type, status')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du contenu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      site_id, 
      type, 
      title, 
      slug, 
      excerpt, 
      content_html, 
      status = 'draft',
      featured_media_id,
      new_author_id,
    } = body;

    // Validation
    if (!site_id || !type || !title || !slug) {
      return NextResponse.json(
        { error: 'site_id, type, title et slug sont requis' },
        { status: 400 }
      );
    }

    if (type !== 'post' && type !== 'page') {
      return NextResponse.json(
        { error: 'Le type doit être "post" ou "page"' },
        { status: 400 }
      );
    }

    // Normaliser le slug
    const normalizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer le contenu
    const content = await createContent({
      site_id,
      type,
      slug: normalizedSlug,
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      content_html: content_html?.trim() || null,
      status,
      published_at: status === 'published' ? new Date().toISOString() : undefined,
      featured_media_id: featured_media_id || null,
      new_author_id: new_author_id || null,
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating content:', error);
    
    // Gérer les erreurs de contrainte unique (slug déjà existant)
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà pour ce site et ce type de contenu' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du contenu' },
      { status: 500 }
    );
  }
}
