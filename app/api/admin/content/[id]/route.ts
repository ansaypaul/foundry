import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { upsertSeoMeta } from '@/lib/db/seo-queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title, slug, excerpt, content_html, status, featured_media_id, author_id,
      // Champs SEO
      seo_title, seo_description, seo_focus_keyword, seo_canonical,
      seo_robots_index, seo_robots_follow, seo_og_title, seo_og_description,
      seo_og_image, seo_twitter_title, seo_twitter_description, seo_twitter_image,
      seo_twitter_card, seo_breadcrumb_title
    } = body;

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
    
    // Mettre à jour le content seulement si on a des changements
    let updated;
    if (Object.keys(updates).length > 0) {
      const { data: updatedContent, error: updateError } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      updated = updatedContent;
    } else {
      // Pas de changements sur le content lui-même, utiliser les données existantes
      updated = existing;
    }

    // Mettre à jour les métadonnées SEO
    const hasSeoData = seo_title !== undefined || seo_description !== undefined || 
                       seo_focus_keyword !== undefined || seo_canonical !== undefined ||
                       seo_robots_index !== undefined || seo_robots_follow !== undefined ||
                       seo_og_title !== undefined || seo_og_description !== undefined ||
                       seo_og_image !== undefined || seo_twitter_title !== undefined ||
                       seo_twitter_description !== undefined || seo_twitter_image !== undefined ||
                       seo_twitter_card !== undefined || seo_breadcrumb_title !== undefined;

    if (hasSeoData) {
      try {
        await upsertSeoMeta('content', id, {
          seo_title: seo_title?.trim() || null,
          seo_description: seo_description?.trim() || null,
          seo_focus_keyword: seo_focus_keyword?.trim() || null,
          seo_canonical: seo_canonical?.trim() || null,
          seo_robots_index,
          seo_robots_follow,
          seo_og_title: seo_og_title?.trim() || null,
          seo_og_description: seo_og_description?.trim() || null,
          seo_og_image: seo_og_image?.trim() || null,
          seo_twitter_title: seo_twitter_title?.trim() || null,
          seo_twitter_description: seo_twitter_description?.trim() || null,
          seo_twitter_image: seo_twitter_image?.trim() || null,
          seo_twitter_card,
          seo_breadcrumb_title: seo_breadcrumb_title?.trim() || null,
        });
      } catch (error) {
        console.error('Error updating SEO meta:', error);
        // On ne fail pas si le SEO échoue
      }
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
