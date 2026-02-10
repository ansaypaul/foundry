import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata } from '@/lib/core/seo';
import CategoryView from '@/app/(public)/[slug]/components/CategoryView';
import ContentView from '@/app/(public)/[slug]/components/ContentView';
import { getPageData } from '@/lib/cached-queries';

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
    const data = await getPageData(siteId, slug);
    
    if (!data) {
      return { title: 'Page non trouvée' };
    }

    const { site, settings, domain } = data;
    
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    
    const seoContext = data.type === 'category' 
      ? {
          entity: data.category,
          entityType: 'term' as const,
          siteUrl,
          siteName: settings?.site_name || site.name,
          siteTagline: settings?.site_tagline || undefined,
          settings,
          currentPath: `/${slug}`,
        }
      : {
          entity: data.content,
          entityType: 'content' as const,
          siteUrl,
          siteName: settings?.site_name || site.name,
          siteTagline: settings?.site_tagline || undefined,
          settings,
          currentPath: `/${slug}`,
        };
    
    const resolvedSeo = await resolveSeoMeta(seoContext);
    return generateSeoMetadata(resolvedSeo);
  } catch (error) {
    console.error('[SEO] Error generating metadata:', error);
    return { title: 'Page' };
  }
}

export default async function ContentPage({ params }: PageProps) {
  const { siteId, slug } = await params;
  
  const data = await getPageData(siteId, slug);
  
  if (!data) {
    notFound();
  }

  const { site } = data;

  // Si catégorie
  if (data.type === 'category') {
    return (
      <CategoryView 
        category={data.category} 
        siteId={site.id} 
        siteName={site.name} 
      />
    );
  }

  // Si contenu (post ou page)
  if (data.content.status !== 'published') {
    notFound();
  }

  return (
    <ContentView 
      content={data.content} 
      siteId={site.id} 
      siteName={site.name}
      isPreview={false}
      isAuthenticated={false}
    />
  );
}
