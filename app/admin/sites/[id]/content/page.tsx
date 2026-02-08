import { getSiteById, getAllContentBySiteId } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteContentPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const content = await getAllContentBySiteId(id);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contenu</h1>
          <p className="text-gray-400 mt-2">Gérer les articles et pages de {site.name}</p>
        </div>
        <Link
          href={`/admin/sites/${id}/content/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau contenu
        </Link>
      </div>

      {/* Content list */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {content.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Aucun contenu pour ce site</p>
            <Link
              href={`/admin/sites/${id}/content/new`}
              className="text-blue-400 hover:text-blue-300"
            >
              Créer votre premier contenu →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {content.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.type === 'post' 
                          ? 'bg-purple-900/30 text-purple-400' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {item.type === 'post' ? 'Article' : 'Page'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'published'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {item.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      {item.published_at && (
                        <span>{new Date(item.published_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/sites/${id}/content/${item.id}`}
                    className="ml-4 px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
