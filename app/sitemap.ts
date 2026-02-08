import { MetadataRoute } from 'next';
import { getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getDomainsBySiteId } from '@/lib/db/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await getAllSites();
  const supabase = getSupabaseAdmin();
  
  const entries: MetadataRoute.Sitemap = [];

  for (const site of sites) {
    // Get primary domain
    const domains = await getDomainsBySiteId(site.id);
    const primaryDomain = domains.find(d => d.is_primary) || domains[0];
    
    if (!primaryDomain) continue;

    const baseUrl = `https://${primaryDomain.hostname}`;

    // Get all published content for this site
    const { data: contents } = await supabase
      .from('content')
      .select('slug, type, updated_at')
      .eq('site_id', site.id)
      .eq('status', 'published');

    // Add homepage
    entries.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });

    // Add content pages
    if (contents) {
      for (const content of contents) {
        entries.push({
          url: `${baseUrl}/${content.slug}`,
          lastModified: new Date(content.updated_at),
          changeFrequency: content.type === 'post' ? 'weekly' : 'monthly',
          priority: content.type === 'post' ? 0.8 : 0.6,
        });
      }
    }
  }

  return entries;
}
