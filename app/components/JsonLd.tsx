/**
 * Composant pour afficher les schémas JSON-LD (Schema.org)
 */

import type { SchemaGraph } from '@/lib/core/seo/config';

interface JsonLdProps {
  schemas: SchemaGraph[];
}

export default function JsonLd({ schemas }: JsonLdProps) {
  if (!schemas || schemas.length === 0) {
    return null;
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  );
}
