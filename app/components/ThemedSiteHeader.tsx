'use client';

import PreviewLink from './PreviewLink';

export default function ThemedSiteHeader({ siteName }: { siteName: string }) {
  return (
    <PreviewLink 
      href="/" 
      className="text-2xl font-bold text-primary no-underline font-heading"
    >
      {siteName}
    </PreviewLink>
  );
}
