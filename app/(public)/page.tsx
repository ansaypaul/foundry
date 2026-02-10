import { getCurrentSite } from '@/lib/core/site-context';
import { getPublishedPostsBySiteId, getCategoriesWithCount } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import PageLayout from './themes/layouts/PageLayout';
import type { Theme } from '@/lib/db/theme-types';
export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteContext = await getCurrentSite();
    if (!siteContext) {
      return { title: 'Admin' };
    }
    const { site, domain } = siteContext;
    
    // Settings SEO
    const settings = await getSeoSettings(site.id);
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

export default async function HomePage() {
  const siteContext = await getCurrentSite();
  
  // Si pas de site, rediriger vers l'admin
  if (!siteContext) {
    redirect('/admin');
  }
  
  const { site } = siteContext;
  
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

  return (
    <PageLayout
      config={homepageConfig}
      data={{
        siteName: site.name,
        siteTagline: seoSettings?.site_tagline || 'Découvrez nos derniers articles',
        posts,
        categories,
      }}
    />
  );
}
