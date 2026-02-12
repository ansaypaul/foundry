'use client';

import PreviewLink from './PreviewLink';

interface Props {
  items: any[];
  location: 'header' | 'footer' | 'sidebar';
  className?: string;
  onClick?: () => void;
  isMobile?: boolean;
}

export default function SiteMenuClient({ items, location, className = '', onClick, isMobile = false }: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  const isFooter = location === 'footer';
  
  // Pour le mobile, on force un affichage vertical
  const ulClassName = isMobile || isFooter 
    ? 'flex flex-col space-y-3' 
    : 'flex space-x-6 items-center';
  
  const linkClassName = isMobile
    ? 'text-base text-gray-700 hover:text-gray-900 font-medium transition-colors block py-2 px-2 rounded-lg hover:bg-gray-100'
    : isFooter
      ? 'text-sm text-gray-600 hover:text-gray-900 transition-colors block'
      : 'text-gray-700 hover:text-gray-900 font-medium transition-colors';

  return (
    <nav className={className}>
      <ul className={ulClassName}>
        {items.map((item: any) => (
          <li key={item.id} className={isMobile ? 'w-full' : ''}>
            <PreviewLink
              href={item.url}
              onClick={onClick}
              className={linkClassName}
            >
              {item.label}
            </PreviewLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
