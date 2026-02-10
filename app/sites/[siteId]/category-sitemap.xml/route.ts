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

  // Récupérer toutes les catégories
  const { data: categories } = await supabase
    .from('terms')
    .select('slug, updated_at')
    .eq('site_id', site.id)
    .eq('type', 'category')
    .order('updated_at', { ascending: false });

  // Générer le XML
  const urls = (categories || [])
    .map(cat => `  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${new Date(cat.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
