import { getMenuByLocation } from '@/lib/db/menus-queries';
import SiteMenuClient from './SiteMenuClient';

interface Props {
  siteId: string;
  location: 'header' | 'footer' | 'sidebar';
  className?: string;
}

export default async function SiteMenu({ siteId, location, className = '' }: Props) {
  const menu = await getMenuByLocation(siteId, location);

  if (!menu || !menu.items) {
    return null;
  }

  let items: any[] = [];
  try {
    items = typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items;
  } catch {
    return null;
  }

  return <SiteMenuClient items={items} location={location} className={className} />;
}
