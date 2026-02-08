'use client';

import PreviewLink from './PreviewLink';

export default function ThemedSiteHeader({ siteName }: { siteName: string }) {
  return (
    <PreviewLink 
      href="/" 
      style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        color: 'var(--color-primary)',
        textDecoration: 'none',
        fontFamily: 'var(--font-heading)'
      }}
    >
      {siteName}
    </PreviewLink>
  );
}
