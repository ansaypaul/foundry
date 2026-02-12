import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await context.params;

    // Vérifier que le site existe
    const site = await getSiteById(siteId);
    if (!site) {
      return NextResponse.json(
        { error: 'Site non trouvé' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Supprimer tout le contenu dans l'ordre pour respecter les contraintes FK
    
    // 1. Récupérer les IDs des termes pour supprimer les relations
    const { data: terms } = await supabase
      .from('terms')
      .select('id')
      .eq('site_id', siteId);

    if (terms && terms.length > 0) {
      const termIds = terms.map(t => t.id);
      await supabase
        .from('term_relations')
        .delete()
        .in('term_id', termIds);
    }

    // 2. Supprimer les idées de contenu (content_ideas)
    await supabase
      .from('content_ideas')
      .delete()
      .eq('site_id', siteId);

    // 3. Supprimer tous les contenus (posts, pages)
    await supabase
      .from('content')
      .delete()
      .eq('site_id', siteId);

    // 4. Supprimer tous les termes (catégories, tags, etc.)
    await supabase
      .from('terms')
      .delete()
      .eq('site_id', siteId);

    // 5. Supprimer tous les auteurs
    await supabase
      .from('authors')
      .delete()
      .eq('site_id', siteId);

    // 6. Supprimer tous les types de contenu personnalisés
    await supabase
      .from('content_types')
      .delete()
      .eq('site_id', siteId);

    // 7. Récupérer les IDs des menus pour supprimer les items
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('site_id', siteId);

    if (menus && menus.length > 0) {
      const menuIds = menus.map(m => m.id);
      await supabase
        .from('menu_items')
        .delete()
        .in('menu_id', menuIds);
    }

    // 8. Supprimer les menus
    await supabase
      .from('menus')
      .delete()
      .eq('site_id', siteId);

    // 9. Réinitialiser le blueprint
    await supabase
      .from('site_blueprint')
      .delete()
      .eq('site_id', siteId);

    // 10. Réinitialiser le statut de setup du site
    await supabase
      .from('sites')
      .update({
        setup_status: 'draft',
        active_blueprint_id: null,
      })
      .eq('id', siteId);

    return NextResponse.json({
      success: true,
      message: 'Le contenu du site a été réinitialisé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du contenu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du contenu' },
      { status: 500 }
    );
  }
}
