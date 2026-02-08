import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description } = body;

    const supabase = getSupabaseAdmin();

    // Préparer les mises à jour
    const updates: any = {};
    if (name) updates.name = name.trim();
    if (slug) {
      updates.slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (description !== undefined) updates.description = description?.trim() || null;

    // Mettre à jour
    const { data, error } = await supabase
      .from('terms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ term: data });
  } catch (error: any) {
    console.error('Error updating term:', error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Supprimer (cascade supprime les relations)
    const { error } = await supabase
      .from('terms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting term:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
