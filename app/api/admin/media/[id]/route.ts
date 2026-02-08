import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Récupérer le média
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json(
        { error: 'Média non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer de Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([media.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Supprimer de la DB
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
