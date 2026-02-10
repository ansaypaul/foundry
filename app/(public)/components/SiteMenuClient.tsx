'use client';

import PreviewLink from './PreviewLink';

interface Props {
  items: any[];
  location: 'header' | 'footer' | 'sidebar';
  className?: string;
  onClick?: () => void;
}

export default function SiteMenuClient({ items, location, className = '', onClick }: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  const isFooter = location === 'footer';

  return (
    <nav className={className}>
      <ul className={isFooter ? 'space-y-2' : 'flex space-x-6 items-center'}>
        {items.map((item: any) => (
          <li key={item.id}>
            <PreviewLink
              href={item.url}
              onClick={onClick}
              className={
                isFooter
                  ? 'text-sm text-gray-600 hover:text-gray-900 transition-colors block'
                  : 'text-gray-700 hover:text-gray-900 font-medium transition-colors'
              }
            >
              {item.label}
            </PreviewLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
