import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { clearDomainCache } from '@/lib/core/site-resolver';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Récupérer le domaine pour obtenir le site_id
    const { data: domain, error: fetchError } = await supabase
      .from('domains')
      .select('site_id')
      .eq('id', id)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json(
        { error: 'Domaine non trouvé' },
        { status: 404 }
      );
    }

    // Retirer le flag is_primary de tous les autres domaines du site
    await supabase
      .from('domains')
      .update({ is_primary: false })
      .eq('site_id', domain.site_id);

    // Définir ce domaine comme primaire
    const { error: updateError } = await supabase
      .from('domains')
      .update({ is_primary: true })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Vider le cache
    clearDomainCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting primary domain:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
