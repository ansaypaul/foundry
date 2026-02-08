import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { clearDomainCache } from '@/lib/core/site-resolver';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Vérifier que ce n'est pas le domaine principal
    const { data: domain, error: fetchError } = await supabase
      .from('domains')
      .select('is_primary')
      .eq('id', id)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json(
        { error: 'Domaine non trouvé' },
        { status: 404 }
      );
    }

    if (domain.is_primary) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le domaine principal' },
        { status: 400 }
      );
    }

    // Supprimer le domaine
    const { error: deleteError } = await supabase
      .from('domains')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Vider le cache
    clearDomainCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
