import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, excerpt, content_html, status, featured_media_id, author_id } = body;

    const supabase = getSupabaseAdmin();

    // Vérifier que le contenu existe
    const { data: existing, error: fetchError } = await supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Contenu non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données à mettre à jour
    const updates: any = {};
    
    if (title) updates.title = title.trim();
    if (slug) {
      updates.slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (excerpt !== undefined) updates.excerpt = excerpt?.trim() || null;
    if (content_html !== undefined) updates.content_html = content_html?.trim() || null;
    if (featured_media_id !== undefined) updates.featured_media_id = featured_media_id;
    if (author_id !== undefined) updates.author_id = author_id || null;
    if (status) {
      updates.status = status;
      // Si on publie, ajouter la date de publication
      if (status === 'published' && !existing.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Mettre à jour
    const { data: updated, error: updateError } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ content: updated });
  } catch (error: any) {
    console.error('Error updating content:', error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà pour ce site' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du contenu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Supprimer le contenu
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du contenu' },
      { status: 500 }
    );
  }
}
