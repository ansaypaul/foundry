import { getSiteById, getTermBySlug, getContentByTermId, getCategoriesWithCount, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { getTermWithSeo } from '@/lib/db/seo-queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import PageLayout from '@/app/themes/layouts/PageLayout';
import type { Theme } from '@/lib/db/theme-types';
export const revalidate = 600; // 10 minutes

interface PageProps {
  params: Promise<{ siteId: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId, slug } = await params;
  
  try {
    const site = await getSiteById(siteId);
    if (!site) {
      return { title: 'Catégorie' };
    }
    
    const categoryBasic = await getTermBySlug(site.id, slug, 'category');
    
    if (!categoryBasic) {
      return { title: 'Catégorie non trouvée' };
    }

    // Charger avec SEO
    const category = await getTermWithSeo(categoryBasic.id) || categoryBasic;
    
    const settings = await getSeoSettings(site.id);
    const domain = await getPrimaryDomainBySiteId(site.id);
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    
    const seoContext = {
      entity: category,
      entityType: 'term' as const,
      siteUrl,
      siteName: settings?.site_name || site.name,
      siteTagline: settings?.site_tagline || undefined,
      settings,
      currentPath: `/category/${slug}`,
    };
    
    const resolvedSeo = await resolveSeoMeta(seoContext);
    return generateSeoMetadata(resolvedSeo);
  } catch {
    return { title: 'Catégorie' };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { siteId, slug } = await params;
  const site = await getSiteById(siteId);
  
  if (!site) {
    notFound();
  }

  // Trouver la catégorie (sans SEO d'abord)
  const categoryBasic = await getTermBySlug(site.id, slug, 'category');

  if (!categoryBasic) {
    notFound();
  }

  // Charger avec SEO
  const category = await getTermWithSeo(categoryBasic.id) || categoryBasic;

  // Récupérer les articles de cette catégorie (enrichis avec auteur + image)
  const rawPosts = await getContentByTermId(category.id);
  
  // Enrichir avec les données manquantes (auteur, image, catégorie)
  const supabase = getSupabaseAdmin();
  const enrichedPosts = await Promise.all(
    rawPosts.map(async (post: any) => {
      // Récupérer l'auteur
      const { data: author } = await supabase.from('users').select('name').eq('id', post.author_id).single();
      // Récupérer l'image
      const { data: media } = post.featured_media_id 
        ? await supabase.from('media').select('url').eq('id', post.featured_media_id).single()
        : { data: null };
      
      return {
        ...post,
        author_name: author?.name || null,
        featured_image_url: media?.url || null,
        category_name: category.name,
      };
    })
  );

  // Récupérer le thème et la config
  const theme = site.theme_id ? await getThemeById(site.theme_id) : null;
  
  const defaultConfig = {
    layout: 'default' as const,
    modules: [
      {
        type: 'posts_grid',
        enabled: true,
        config: { columns: 2, showExcerpt: true, showDate: true, showCategories: false }
      }
    ],
    sidebar: {
      enabled: true,
      position: 'right' as const,
      modules: [
        { type: 'categories', enabled: true, config: {} }
      ]
    }
  };

  const siteModulesConfig = (site as any)?.theme_config?.modules_config?.category;
  const themeModulesConfig = (theme as Theme)?.modules_config?.category;
  const categoryConfig = siteModulesConfig || themeModulesConfig || defaultConfig;

  // Récupérer les catégories pour la sidebar
  const categories = await getCategoriesWithCount(site.id);

  return (
    <div>
      {/* Header catégorie */}
      <div 
        className="py-12 mb-8"
        style={{ 
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <span 
            className="inline-block px-3 py-1 text-sm rounded-full font-medium mb-4"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            Catégorie
          </span>
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ 
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {category.name}
          </h1>
          {category.description && (
            <p 
              className="text-xl"
              style={{ 
                color: 'var(--color-text)',
                opacity: 0.8
              }}
            >
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Layout avec modules configurables */}
      <PageLayout
        config={categoryConfig}
        data={{
          siteName: site.name,
          posts: enrichedPosts,
          categories,
        }}
      />
    </div>
  );
}
