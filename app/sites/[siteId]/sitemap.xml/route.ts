import { getSiteById, getDomainsBySiteId } from '@/lib/db/queries';
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

  // Index des sous-sitemaps comme Rank Math
  const sitemaps = [
    { loc: `${baseUrl}/page-sitemap.xml`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/post-sitemap.xml`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/category-sitemap.xml`, lastmod: new Date().toISOString() },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
