import { getSiteById, getTermBySlug, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { getContentBySlugWithSeo } from '@/lib/db/seo-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import CategoryView from '@/app/(public)/[slug]/components/CategoryView';
import ContentView from '@/app/(public)/[slug]/components/ContentView';
export const revalidate = 300; // 5 minutes

interface PageProps {
  params: Promise<{ siteId: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
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

export default async function ContentPage({ params, searchParams }: PageProps) {
  const { siteId, slug } = await params;
  const { preview } = await searchParams;
  
  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }
  
  // Vérifier si on est en mode preview (pour voir les articles draft/scheduled)
  const isPreview = preview === '1';
  let isAuthenticated = false;
  
  if (isPreview) {
    // Vérifier si l'utilisateur est connecté
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    isAuthenticated = cookieStore.has('foundry-session');
  }

  // 1. Vérifier si c'est une catégorie
  const categoryBasic = await getTermBySlug(site.id, slug, 'category');
  if (categoryBasic) {
    const { getTermWithSeo } = await import('@/lib/db/seo-queries');
    const category = await getTermWithSeo(categoryBasic.id) || categoryBasic;
    
    return <CategoryView category={category} siteId={site.id} siteName={site.name} />;
  }

  // 2. Essayer de trouver un article/page
  let content;
  
  if (isPreview && isAuthenticated) {
    // En mode preview, on peut voir les articles draft/scheduled
    const supabase = getSupabaseAdmin();
    const { data: previewContent } = await supabase
      .from('content')
      .select('*')
      .eq('site_id', site.id)
      .eq('slug', slug)
      .single();
    
    content = previewContent;
  } else {
    // Mode normal : seulement les articles publiés (avec SEO)
    content = await getContentBySlugWithSeo(site.id, slug, 'post');
    
    if (!content) {
      content = await getContentBySlugWithSeo(site.id, slug, 'page');
    }
  }

  // 3. Si toujours pas trouvé, 404
  if (!content) {
    notFound();
  }
  
  // 4. Si l'article n'est pas publié et qu'on n'est pas authentifié, 404
  if (content.status !== 'published' && (!isPreview || !isAuthenticated)) {
    notFound();
  }

  // 5. Afficher l'article/page
  return (
    <ContentView 
      content={content} 
      siteId={site.id} 
      siteName={site.name}
      isPreview={isPreview}
      isAuthenticated={isAuthenticated}
    />
  );
}
