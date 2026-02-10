import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();
    const { 
      custom_robots_txt,
      schema_article_type,
      schema_enable_organization,
      schema_enable_website,
    } = body;

    const supabase = getSupabaseAdmin();

    // Préparer les données à mettre à jour
    const updateData: any = {};
    if (custom_robots_txt !== undefined) updateData.custom_robots_txt = custom_robots_txt;
    if (schema_article_type) updateData.schema_article_type = schema_article_type;
    if (schema_enable_organization !== undefined) updateData.schema_enable_organization = schema_enable_organization;
    if (schema_enable_website !== undefined) updateData.schema_enable_website = schema_enable_website;

    // Mettre à jour les paramètres SEO
    const { error } = await supabase
      .from('seo_settings')
      .update(updateData)
      .eq('site_id', siteId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres SEO:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
