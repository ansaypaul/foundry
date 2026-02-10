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
      // Global config
      site_name,
      site_tagline,
      site_description,
      separator,
      // Title templates
      title_template_post,
      title_template_page,
      title_template_category,
      title_template_tag,
      title_template_home,
      // Default meta
      default_og_image,
      default_twitter_card,
      // Social
      twitter_username,
      facebook_app_id,
      // Organization
      organization_name,
      organization_logo,
      // Locale
      default_locale,
      // Robots.txt
      custom_robots_txt,
      // Schema
      schema_article_type,
      schema_enable_organization,
      schema_enable_website,
      schema_enable_breadcrumbs,
    } = body;

    const supabase = getSupabaseAdmin();

    // Préparer les données à mettre à jour
    const updateData: any = {};
    
    // Global config
    if (site_name !== undefined) updateData.site_name = site_name;
    if (site_tagline !== undefined) updateData.site_tagline = site_tagline;
    if (site_description !== undefined) updateData.site_description = site_description;
    if (separator !== undefined) updateData.separator = separator;
    
    // Title templates
    if (title_template_post !== undefined) updateData.title_template_post = title_template_post;
    if (title_template_page !== undefined) updateData.title_template_page = title_template_page;
    if (title_template_category !== undefined) updateData.title_template_category = title_template_category;
    if (title_template_tag !== undefined) updateData.title_template_tag = title_template_tag;
    if (title_template_home !== undefined) updateData.title_template_home = title_template_home;
    
    // Default meta
    if (default_og_image !== undefined) updateData.default_og_image = default_og_image;
    if (default_twitter_card !== undefined) updateData.default_twitter_card = default_twitter_card;
    
    // Social
    if (twitter_username !== undefined) updateData.twitter_username = twitter_username;
    if (facebook_app_id !== undefined) updateData.facebook_app_id = facebook_app_id;
    
    // Organization
    if (organization_name !== undefined) updateData.organization_name = organization_name;
    if (organization_logo !== undefined) updateData.organization_logo = organization_logo;
    
    // Locale
    if (default_locale !== undefined) updateData.default_locale = default_locale;
    
    // Robots.txt
    if (custom_robots_txt !== undefined) updateData.custom_robots_txt = custom_robots_txt;
    
    // Schema
    if (schema_article_type !== undefined) updateData.schema_article_type = schema_article_type;
    if (schema_enable_organization !== undefined) updateData.schema_enable_organization = schema_enable_organization;
    if (schema_enable_website !== undefined) updateData.schema_enable_website = schema_enable_website;
    if (schema_enable_breadcrumbs !== undefined) updateData.schema_enable_breadcrumbs = schema_enable_breadcrumbs;

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
