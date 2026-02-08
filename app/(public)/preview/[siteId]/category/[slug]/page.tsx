import { notFound } from 'next/navigation';
import { getSiteById, getTermBySlug, getContentByTermId } from '@/lib/db/queries';
import Link from 'next/link';

interface PageProps {
  params: {
    siteId: string;
    slug: string;
  };
}

export default async function PreviewCategoryPage({ params }: PageProps) {
  const { siteId, slug } = params;

  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }

  const category = await getTermBySlug(siteId, slug, 'category');
  if (!category) {
    notFound();
  }

  const allContent = await getContentByTermId(category.id);
  const publishedContent = allContent.filter(c => c.status === 'published');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Preview */}
      <div className="bg-yellow-600 text-black py-2 px-4 text-center text-sm font-medium">
        🔍 Mode Aperçu : {site.name} | <Link href={`/admin/sites/${siteId}`} className="underline">Retour admin</Link>
      </div>

      {/* Header du site */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href={`/preview/${siteId}`} className="text-blue-400 hover:text-blue-300 text-sm">
            ← Retour à {site.name}
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-400">{category.description}</p>
          )}
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedContent.length === 0 ? (
            <p className="text-gray-400 col-span-full">Aucun contenu dans cette catégorie.</p>
          ) : (
            publishedContent.map(content => (
              <article key={content.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {content.featured_media_id && (
                  <div className="aspect-video relative bg-gray-700">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      📷
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">
                    <Link
                      href={`/preview/${siteId}/content/${content.slug}`}
                      className="hover:text-blue-400"
                    >
                      {content.title}
                    </Link>
                  </h2>
                  {content.excerpt && (
                    <p className="text-gray-400 text-sm">{content.excerpt}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    {content.published_at && new Date(content.published_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {site.name} - Propulsé par Foundry</p>
        </div>
      </footer>
    </div>
  );
}
