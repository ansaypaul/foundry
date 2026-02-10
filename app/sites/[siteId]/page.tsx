import { getSiteById, getPublishedPostsBySiteId, getCategoriesWithCount, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import PageLayout from '@/app/themes/layouts/PageLayout';
import JsonLd from '@/app/components/JsonLd';
import type { Theme } from '@/lib/db/theme-types';
export const revalidate = 120; // 2 minutes

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { siteId } = await params;
    const site = await getSiteById(siteId);
    
    if (!site) {
      return { title: 'Site non trouvé' };
    }
    
    // Settings SEO
    const settings = await getSeoSettings(site.id);
    const domain = await getPrimaryDomainBySiteId(site.id);
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    
    const seoContext = {
      entity: null,
      entityType: 'home' as const,
      siteUrl,
      siteName: settings?.site_name || site.name,
      siteTagline: settings?.site_tagline || undefined,
      settings,
      currentPath: '/',
    };
    
    const resolvedSeo = await resolveSeoMeta(seoContext);
    return generateSeoMetadata(resolvedSeo);
  } catch {
    return { title: 'Site' };
  }
}

export default async function HomePage({ params }: PageProps) {
  const { siteId } = await params;
  const site = await getSiteById(siteId);
  
  if (!site) {
    return <div>Site non trouvé</div>;
  }
  
  // Récupérer le thème du site
  const theme = site.theme_id ? await getThemeById(site.theme_id) : null;
  
  // Configuration par défaut si pas de thème ou pas de configuration de modules
  const defaultConfig = {
    layout: 'default' as const,
    modules: [
      {
        type: 'hero',
        enabled: true,
        config: {
          showTitle: true,
          showTagline: true,
          centered: true,
        },
      },
      {
        type: 'posts_grid',
        enabled: true,
        config: {
          columns: 2,
          showExcerpt: true,
          showDate: true,
          limit: 6,
        },
      },
    ],
    sidebar: {
      enabled: false,
    },
  };

  // Priorité de configuration :
  // 1. Configuration du site (theme_config.homepage) - surcharge personnalisée
  // 2. Configuration du thème (modules_config.homepage) - défaut du thème
  // 3. Configuration par défaut (defaultConfig) - fallback
  const siteModulesConfig = site.theme_config?.modules_config?.homepage;
  const themeModulesConfig = (theme as Theme)?.modules_config?.homepage;
  const homepageConfig = siteModulesConfig || themeModulesConfig || defaultConfig;
  
  // Récupérer les données nécessaires
  const posts = await getPublishedPostsBySiteId(site.id);
  const categories = await getCategoriesWithCount(site.id);
  
  // Récupérer les settings SEO pour le tagline
  const seoSettings = await getSeoSettings(site.id);

  // Générer les schémas JSON-LD
  let schemas: any[] = [];
  try {
    const domain = await getPrimaryDomainBySiteId(site.id);
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    
    const seoContext = {
      entity: null,
      entityType: 'home' as const,
      siteUrl,
      siteName: seoSettings?.site_name || site.name,
      siteTagline: seoSettings?.site_tagline || undefined,
      settings: seoSettings,
      currentPath: '/',
    };
    
    const resolvedSeo = await resolveSeoMeta(seoContext);
    schemas = resolvedSeo.schema || [];
  } catch (error) {
    console.error('[SEO] Error generating schemas:', error);
  }

  return (
    <>
      <JsonLd schemas={schemas} />
      <PageLayout
        config={homepageConfig}
        data={{
          siteName: site.name,
          siteTagline: seoSettings?.site_tagline || 'Découvrez nos derniers articles',
          posts,
          categories,
        }}
      />
    </>
  );
}
