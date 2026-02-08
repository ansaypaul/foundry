import { NextRequest, NextResponse } from 'next/server';
import { getSiteById, updateSite } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, theme_key, theme_id, status } = body;

    // Vérifier que le site existe
    const existingSite = await getSiteById(id);
    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le site
    const updatedSite = await updateSite(id, {
      ...(name && { name: name.trim() }),
      ...(theme_key && { theme_key }),
      ...(theme_id !== undefined && { theme_id }),
      ...(status && { status }),
    });

    // Si le thème a changé, invalider toutes les pages publiques du site
    if (theme_id !== undefined) {
      // Récupérer tous les domaines du site
      const supabase = getSupabaseAdmin();
      const { data: domains } = await supabase
        .from('domains')
        .select('hostname')
        .eq('site_id', id);

      // Invalider le cache pour chaque domaine
      if (domains && domains.length > 0) {
        // On invalide le layout public
        revalidatePath('/(public)', 'layout');
        // On invalide aussi toutes les pages
        revalidatePath('/', 'page');
      }
    }

    return NextResponse.json({ site: updatedSite });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du site' },
      { status: 500 }
    );
  }
}
