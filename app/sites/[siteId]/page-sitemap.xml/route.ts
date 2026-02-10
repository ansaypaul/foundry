import { getSiteById, getDomainsBySiteId } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { NextResponse } from 'next/server';
export const revalidate = 3600; // 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const site = await getSiteById(siteId);
  
  if (!site) {
    return new NextResponse('Site not found', { status: 404 });
  }

  const domains = await getDomainsBySiteId(site.id);
  const primaryDomain = domains.find(d => d.is_primary) || domains[0];
  
  if (!primaryDomain) {
    return new NextResponse('No domain configured', { status: 404 });
  }

  const baseUrl = `https://${primaryDomain.hostname}`;
  const supabase = getSupabaseAdmin();

  // Récupérer toutes les pages publiées
  const { data: pages } = await supabase
    .from('content')
    .select('slug, updated_at')
    .eq('site_id', site.id)
    .eq('type', 'page')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  // Récupérer les paramètres sitemap
  const { data: seoSettings } = await supabase
    .from('seo_settings')
    .select('sitemap_pages_priority, sitemap_pages_changefreq')
    .eq('site_id', site.id)
    .single();

  const priority = seoSettings?.sitemap_pages_priority ?? 0.6;
  const changefreq = seoSettings?.sitemap_pages_changefreq ?? 'monthly';

  // Générer le XML
  const urls = [
    // Homepage
    `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    // Pages
    ...(pages || [])
      .map(page => `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${new Date(page.updated_at).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
  ].join('\n');

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
