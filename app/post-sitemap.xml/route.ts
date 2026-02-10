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
    return new NextResponse(`Site not found for hostname: ${cleanHostname}`, { status: 404 });
  }

  const domains = await getDomainsBySiteId(site.id);
  const primaryDomain = domains.find(d => d.is_primary) || domains[0];
  const baseUrl = `https://${primaryDomain.hostname}`;
  
  const supabase = getSupabaseAdmin();

  // Récupérer tous les articles publiés
  const { data: posts } = await supabase
    .from('content')
    .select('slug, updated_at')
    .eq('site_id', site.id)
    .eq('type', 'post')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  // Récupérer les paramètres sitemap
  const { data: seoSettings } = await supabase
    .from('seo_settings')
    .select('sitemap_posts_priority, sitemap_posts_changefreq')
    .eq('site_id', site.id)
    .single();

  const priority = seoSettings?.sitemap_posts_priority ?? 0.8;
  const changefreq = seoSettings?.sitemap_posts_changefreq ?? 'weekly';

  // Générer le XML
  const urls = (posts || [])
    .map(post => `  <url>
    <loc>${baseUrl}/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
