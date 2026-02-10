import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getSiteByHostname } from '@/lib/db/queries';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  
  // Retirer le port si présent (ex: localhost:3000 -> localhost)
  const cleanHostname = hostname.split(':')[0];
  
  const site = await getSiteByHostname(cleanHostname);
  
  if (!site) {
    return [];
  }

  const baseUrl = `https://${cleanHostname}`;

  // Index des sous-sitemaps comme Rank Math
  return [
    {
      url: `${baseUrl}/page-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/post-sitemap.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/category-sitemap.xml`,
      lastModified: new Date(),
    },
  ];
}
