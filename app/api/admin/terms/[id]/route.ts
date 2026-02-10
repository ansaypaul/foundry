import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { upsertSeoMeta } from '@/lib/db/seo-queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log('🔍 Updating term:', id);
    
    const body = await request.json();
    const { 
      name, slug, description,
      seo_title, seo_description, seo_canonical, seo_robots_index, seo_robots_follow,
      seo_og_title, seo_og_description, seo_og_image,
      seo_twitter_title, seo_twitter_description, seo_twitter_image
    } = body;

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

    console.log('📝 Updates:', updates, 'hasUpdates:', Object.keys(updates).length > 0);

    // Mettre à jour seulement si on a des changements
    let data;
    if (Object.keys(updates).length > 0) {
      console.log('⚡ Updating term fields...');
      const { data: updatedTerm, error } = await supabase
        .from('terms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating term fields:', error);
        throw error;
      }
      console.log('✅ Term fields updated');
      data = updatedTerm;
    } else {
      console.log('📖 No term updates, fetching existing...');
      const { data: existingTerm, error } = await supabase
        .from('terms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching existing term:', error);
        throw error;
      }
      console.log('✅ Existing term fetched');
      data = existingTerm;
    }

    // Sauvegarder les métadonnées SEO dans seo_meta
    const hasSeoData = seo_title !== undefined || seo_description !== undefined ||
                       seo_canonical !== undefined || seo_robots_index !== undefined ||
                       seo_robots_follow !== undefined || seo_og_image !== undefined ||
                       seo_og_title !== undefined || seo_og_description !== undefined ||
                       seo_twitter_title !== undefined || seo_twitter_description !== undefined ||
                       seo_twitter_image !== undefined;

    if (hasSeoData) {
      console.log('🔍 Updating SEO meta...');
      try {
        await upsertSeoMeta('term', id, {
          seo_title: seo_title?.trim() || null,
          seo_description: seo_description?.trim() || null,
          seo_canonical: seo_canonical?.trim() || null,
          seo_robots_index,
          seo_robots_follow,
          seo_og_title: seo_og_title?.trim() || null,
          seo_og_description: seo_og_description?.trim() || null,
          seo_og_image: seo_og_image?.trim() || null,
          seo_twitter_title: seo_twitter_title?.trim() || null,
          seo_twitter_description: seo_twitter_description?.trim() || null,
          seo_twitter_image: seo_twitter_image?.trim() || null,
        });
        console.log('✅ SEO meta updated');
      } catch (error) {
        console.error('❌ Error updating SEO meta for term:', error);
        throw error; // Rethrow pour voir l'erreur réelle
      }
    }

    console.log('✅ Term update complete');
    return NextResponse.json({ term: data });
  } catch (error: any) {
    console.error('❌ Error updating term:', error);
    
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
