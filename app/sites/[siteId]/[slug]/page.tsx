import { getSiteById, getTermBySlug, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { getContentBySlugWithSeo } from '@/lib/db/seo-queries';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import CategoryView from '@/app/(public)/[slug]/components/CategoryView';
import ContentView from '@/app/(public)/[slug]/components/ContentView';
export const revalidate = 300; // 5 minutes

interface PageProps {
  params: Promise<{ siteId: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId, slug } = await params;
  
  if (slug === 'admin' || slug.startsWith('_next')) {
    return { title: 'Page' };
  }
  
  try {
    const site = await getSiteById(siteId);
    if (!site) {
      return { title: 'Page' };
    }
    
    // 1. Vérifier si c'est une catégorie
    const categoryBasic = await getTermBySlug(site.id, slug, 'category');
    if (categoryBasic) {
      const { getTermWithSeo } = await import('@/lib/db/seo-queries');
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
        currentPath: `/${slug}`,
      };
      
      const resolvedSeo = await resolveSeoMeta(seoContext);
      return generateSeoMetadata(resolvedSeo);
    }
    
    // 2. Sinon, chercher un article ou une page
    let content = await getContentBySlugWithSeo(site.id, slug, 'post');
    if (!content) {
      content = await getContentBySlugWithSeo(site.id, slug, 'page');
    }
    
    if (!content) {
      return { title: 'Page non trouvée' };
    }

    // Charger les settings SEO
    const settings = await getSeoSettings(site.id);
    const domain = await getPrimaryDomainBySiteId(site.id);
    
    // Construire le contexte SEO
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    const seoContext = {
      entity: content,
      entityType: 'content' as const,
      siteUrl,
      siteName: settings?.site_name || site.name,
      siteTagline: settings?.site_tagline || undefined,
      settings,
      currentPath: `/${slug}`,
    };
    
    // Résoudre les métas SEO avec fallbacks intelligents
    const resolvedSeo = await resolveSeoMeta(seoContext);
    
    // Générer l'objet Metadata pour Next.js
    return generateSeoMetadata(resolvedSeo);
  } catch (error) {
    console.error('[SEO] Error generating metadata:', error);
    return { title: 'Page' };
  }
}

export default async function ContentPage({ params }: PageProps) {
  const { siteId, slug } = await params;
  
  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }

  // 1. Vérifier si c'est une catégorie
  const categoryBasic = await getTermBySlug(site.id, slug, 'category');
  if (categoryBasic) {
    const { getTermWithSeo } = await import('@/lib/db/seo-queries');
    const category = await getTermWithSeo(categoryBasic.id) || categoryBasic;
    
    return <CategoryView category={category} siteId={site.id} siteName={site.name} />;
  }

  // 2. Chercher un article ou une page publiée
  let content = await getContentBySlugWithSeo(site.id, slug, 'post');
  
  if (!content) {
    content = await getContentBySlugWithSeo(site.id, slug, 'page');
  }

  // 3. Si pas trouvé ou pas publié, 404
  if (!content || content.status !== 'published') {
    notFound();
  }

  // 4. Afficher l'article/page
  return (
    <ContentView 
      content={content} 
      siteId={site.id} 
      siteName={site.name}
      isPreview={false}
      isAuthenticated={false}
    />
  );
}
