import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import SeoSettingsForm from './SeoSettingsForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SeoSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  
  // Récupérer ou créer les paramètres SEO
  let { data: seoSettings } = await supabase
    .from('seo_settings')
    .select('*')
    .eq('site_id', id)
    .single();

  // Si pas de paramètres SEO, créer des valeurs par défaut
  if (!seoSettings) {
    const { data: newSettings } = await supabase
      .from('seo_settings')
      .insert({
        site_id: id,
        site_name: site.name,
        separator: '|',
        title_template_post: '{{title}} | {{siteName}}',
        title_template_page: '{{title}} | {{siteName}}',
        title_template_category: '{{name}} | {{siteName}}',
        title_template_tag: '{{name}} | {{siteName}}',
        title_template_home: '{{siteName}}',
        default_twitter_card: 'summary_large_image',
        default_locale: 'fr_FR',
        sitemap_posts_priority: 0.8,
        sitemap_posts_changefreq: 'weekly',
        sitemap_pages_priority: 0.6,
        sitemap_pages_changefreq: 'monthly',
        schema_article_type: 'Article',
        schema_enable_organization: true,
        schema_enable_website: true,
        schema_enable_breadcrumbs: true,
      })
      .select()
      .single();
    
    seoSettings = newSettings;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Paramètres SEO</h1>
        <p className="text-gray-400 mt-2">
          Configuration SEO pour {site.name}
        </p>
      </div>

      <SeoSettingsForm siteId={id} initialSettings={seoSettings} />
    </div>
  );
}
