import { notFound } from 'next/navigation';
import { getSiteById, getContentBySlug } from '@/lib/db/queries';
import Link from 'next/link';

interface PageProps {
  params: {
    siteId: string;
    slug: string;
  };
}

export default async function PreviewContentPage({ params }: PageProps) {
  const { siteId, slug } = params;

  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }

  const content = await getContentBySlug(siteId, slug, 'post');
  if (!content || content.status !== 'published') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Preview */}
      <div className="bg-yellow-600 text-black py-2 px-4 text-center text-sm font-medium">
        🔍 Mode Aperçu : {site.name} | <Link href={`/admin/sites/${siteId}`} className="underline">Retour admin</Link>
      </div>

      {/* Header du site */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href={`/preview/${siteId}`} className="text-blue-400 hover:text-blue-300">
            ← Retour à {site.name}
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            {content.excerpt && (
              <p className="text-xl text-gray-400 mb-4">{content.excerpt}</p>
            )}
            <div className="text-sm text-gray-500">
              {content.published_at && (
                <time dateTime={new Date(content.published_at).toISOString()}>
                  {new Date(content.published_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              )}
            </div>
          </header>

          {content.featured_media_id && (
            <div className="aspect-video relative bg-gray-800 rounded-lg mb-8">
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                📷 Image à la une
              </div>
            </div>
          )}

          <div
            className="prose prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content_html }}
          />
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {site.name} - Propulsé par Foundry</p>
        </div>
      </footer>
    </div>
  );
}
