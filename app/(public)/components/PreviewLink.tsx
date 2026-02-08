'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentProps } from 'react';

export default function PreviewLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  
  // Détecter si on est en mode preview
  const previewMatch = pathname?.match(/^\/preview\/([a-f0-9-]+)/);
  
  if (previewMatch && typeof href === 'string') {
    const siteId = previewMatch[1];
    
    // Si c'est une URL absolue (commence par http:// ou https://)
    if (href.match(/^https?:\/\//)) {
      try {
        const url = new URL(href);
        // Extraire juste le path + query + hash
        href = url.pathname + url.search + url.hash;
      } catch {
        // Si l'URL est invalide, on la laisse telle quelle
      }
    }
    
    // Si c'est une URL relative, ajouter le préfixe preview
    if (href.startsWith('/') && !href.startsWith('/preview/')) {
      href = `/preview/${siteId}${href}`;
    }
  }
  
  return <Link href={href} {...props} />;
}
