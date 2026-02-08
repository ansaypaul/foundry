'use client';

import PreviewLink from './PreviewLink';

export default function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <PreviewLink href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
      {siteName}
    </PreviewLink>
  );
}
