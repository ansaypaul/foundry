import { redirect } from 'next/navigation';
import { getSiteById, getAllContentBySiteId, getTermsBySiteId } from '@/lib/db/queries';
import Link from 'next/link';
import Image from 'next/image';

interface PageProps {
  params: {
    siteId: string;
  };
}

export default async function PreviewPage({ params }: PageProps) {
  const { siteId } = params;

  // Charger le site
  const site = await getSiteById(siteId);
  
  if (!site) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Site introuvable</h1>
          <p className="text-gray-400">Ce site n'existe pas.</p>
        </div>
      </div>
    );
  }

  // Charger le contenu publié
  const allContent = await getAllContentBySiteId(siteId);
  const publishedContent = allContent.filter(c => c.status === 'published');
  
  // Charger les catégories
  const allTerms = await getTermsBySiteId(siteId);
  const categories = allTerms.filter(t => t.taxonomy === 'category');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Preview */}
      <div className="bg-yellow-600 text-black py-2 px-4 text-center text-sm font-medium">
        🔍 Mode Aperçu : {site.name} | <Link href={`/admin/sites/${siteId}`} className="underline">Retour admin</Link>
      </div>

      {/* Header du site */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <nav className="mt-4 flex gap-6">
            <Link href={`/preview/${siteId}`} className="text-gray-300 hover:text-white">
              Accueil
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/preview/${siteId}/category/${cat.slug}`}
                className="text-gray-300 hover:text-white"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Articles récents</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedContent.length === 0 ? (
              <p className="text-gray-400 col-span-full">Aucun contenu publié.</p>
            ) : (
              publishedContent.slice(0, 9).map(content => (
                <article key={content.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  {content.featured_media_id && (
                    <div className="aspect-video relative bg-gray-700">
                      {/* Image placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        📷
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">
                      <Link
                        href={`/preview/${siteId}/content/${content.slug}`}
                        className="hover:text-blue-400"
                      >
                        {content.title}
                      </Link>
                    </h3>
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
