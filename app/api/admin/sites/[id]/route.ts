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
    const { name, theme_key, theme_id, theme_config, status, language, country, site_type, automation_level, ambition_level, description } = body;

    // Vérifier que le site existe
    const existingSite = await getSiteById(id);
    if (!existingSite) {
      return NextResponse.json(
        { error: 'Site non trouvé' },
        { status: 404 }
      );
    }

    // Validation des enums si fournis
    if (site_type) {
      const validSiteTypes = ['niche_passion', 'news_media', 'gaming_popculture', 'affiliate_guides', 'lifestyle'];
      if (!validSiteTypes.includes(site_type)) {
        return NextResponse.json(
          { error: 'Type de site invalide' },
          { status: 400 }
        );
      }
    }

    if (automation_level) {
      const validAutomationLevels = ['manual', 'ai_assisted', 'ai_auto'];
      if (!validAutomationLevels.includes(automation_level)) {
        return NextResponse.json(
          { error: 'Niveau d\'automatisation invalide' },
          { status: 400 }
        );
      }
    }

    if (ambition_level) {
      const validAmbitionLevels = ['auto', 'starter', 'growth', 'factory'];
      if (!validAmbitionLevels.includes(ambition_level)) {
        return NextResponse.json(
          { error: 'Niveau d\'ambition invalide' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le site
    const updatedSite = await updateSite(id, {
      ...(name && { name: name.trim() }),
      ...(theme_key && { theme_key }),
      ...(theme_id !== undefined && { theme_id }),
      ...(theme_config !== undefined && { theme_config }),
      ...(status && { status }),
      ...(language && { language }),
      ...(country && { country }),
      ...(site_type && { site_type }),
      ...(automation_level && { automation_level }),
      ...(ambition_level && { ambition_level }),
      ...(description !== undefined && { description: description ? description.trim() : null }),
    });

    // Si le thème ou la config a changé, invalider TOUT le cache du site
    if (theme_id !== undefined || theme_config !== undefined) {
      // Invalider agressivement tout le cache
      revalidatePath('/', 'layout'); // Invalide tout depuis la racine
      revalidatePath('/(public)', 'layout'); // Layout public
      revalidatePath('/[slug]', 'page'); // Articles
      revalidatePath('/category/[slug]', 'page'); // Catégories
      revalidatePath('/tag/[slug]', 'page'); // Tags
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
