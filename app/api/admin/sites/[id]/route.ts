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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier que le site existe
    const existingSite = await getSiteById(id);
    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site non trouvé' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Récupérer d'abord les IDs de contenu pour supprimer les relations
    const { data: contentIds } = await supabase
      .from('content')
      .select('id')
      .eq('site_id', id);

    // Supprimer les relations de termes
    if (contentIds && contentIds.length > 0) {
      await supabase
        .from('term_relations')
        .delete()
        .in('content_id', contentIds.map(c => c.id));
    }

    // Supprimer les memberships
    await supabase.from('memberships').delete().eq('site_id', id);

    // Supprimer le contenu
    await supabase.from('content').delete().eq('site_id', id);

    // Supprimer les termes
    await supabase.from('terms').delete().eq('site_id', id);

    // Supprimer les médias
    await supabase.from('media').delete().eq('site_id', id);

    // Supprimer les menus
    await supabase.from('menus').delete().eq('site_id', id);

    // Supprimer les domaines
    await supabase.from('domains').delete().eq('site_id', id);

    // Supprimer le site
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du site' },
      { status: 500 }
    );
  }
}
