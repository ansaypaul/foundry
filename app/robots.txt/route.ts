import { headers } from 'next/headers';
import { getSiteByHostname, getDomainsBySiteId } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { NextResponse } from 'next/server';
export const revalidate = 3600;

export async function GET() {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const cleanHostname = hostname.split(':')[0];
  
  const site = await getSiteByHostname(cleanHostname);
  
  if (!site) {
    // Robots.txt par défaut si le site n'est pas trouvé
    return new NextResponse(
      `User-agent: *\nDisallow: /admin/\nDisallow: /api/`,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
  }

  const domains = await getDomainsBySiteId(site.id);
  const primaryDomain = domains.find(d => d.is_primary) || domains[0];
  const baseUrl = primaryDomain ? `https://${primaryDomain.hostname}` : `https://${cleanHostname}`;
  
  const supabase = getSupabaseAdmin();

  // Vérifier s'il y a un robots.txt personnalisé dans les paramètres SEO
  const { data: seoSettings } = await supabase
    .from('seo_settings')
    .select('custom_robots_txt')
    .eq('site_id', site.id)
    .single();

  // Si un robots.txt personnalisé existe, l'utiliser
  if (seoSettings?.custom_robots_txt) {
    return new NextResponse(seoSettings.custom_robots_txt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  // Sinon, générer un robots.txt par défaut optimisé pour Google
  const robotsTxt = `# Robots.txt optimisé pour ${site.name}
# Généré automatiquement

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Optimisations pour Google
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

# Optimisations pour Bing
User-agent: Bingbot
Allow: /

# Temps d'attente entre les requêtes (en secondes)
Crawl-delay: 1
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
