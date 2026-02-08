import { getSiteById } from '@/lib/db/queries';
import { getTermsBySiteId } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteTermsPage({ params }: PageProps) {
  const { id } = await params;
  const [site, categories, tags] = await Promise.all([
    getSiteById(id),
    getTermsBySiteId(id, 'category'),
    getTermsBySiteId(id, 'tag'),
  ]);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Taxonomies</h1>
          <p className="text-gray-400 mt-2">Catégories et tags de {site.name}</p>
        </div>
        <Link
          href={`/admin/sites/${id}/terms/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau
        </Link>
      </div>

      <div className="space-y-8">
        {/* Catégories */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Catégories ({categories.length})
          </h2>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aucune catégorie</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-white font-medium">{cat.name}</span>
                    <span className="text-gray-400 text-sm ml-3">/{cat.slug}</span>
                  </div>
                  <Link
                    href={`/admin/sites/${id}/terms/${cat.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Modifier
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Tags ({tags.length})
          </h2>
          {tags.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aucun tag</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/admin/sites/${id}/terms/${tag.id}`}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
