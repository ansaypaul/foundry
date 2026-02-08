import { getMenuByLocation } from '@/lib/db/menus-queries';
import Link from 'next/link';

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

  if (items.length === 0) {
    return null;
  }

  const isFooter = location === 'footer';

  return (
    <nav className={className}>
      <ul className={isFooter ? 'space-y-2' : 'flex space-x-6 items-center'}>
        {items.map((item: any) => (
          <li key={item.id}>
            <Link
              href={item.url}
              className={
                isFooter
                  ? 'text-sm text-gray-600 hover:text-gray-900 transition-colors block'
                  : 'text-gray-700 hover:text-gray-900 font-medium transition-colors'
              }
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
