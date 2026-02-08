import { NextRequest, NextResponse } from 'next/server';
import { setContentTerms } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contentId } = await params;
    const { term_ids } = await request.json();

    // Récupérer le site_id du contenu
    const supabase = getSupabaseAdmin();
    const { data: content, error } = await supabase
      .from('content')
      .select('site_id')
      .eq('id', contentId)
      .single();

    if (error || !content) {
      return NextResponse.json(
        { error: 'Contenu non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour les relations
    await setContentTerms(contentId, content.site_id, term_ids || []);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating content terms:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des taxonomies' },
      { status: 500 }
    );
  }
}
