import { getAllSites, getTermsBySiteId } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import Link from 'next/link';

export default async function TermsPage() {
  const supabase = getSupabaseAdmin();
  const sites = await getAllSites();

  // Récupérer toutes les catégories et tags
  const { data: terms } = await supabase
    .from('terms')
    .select(`
      *,
      site:sites(name)
    `)
    .order('created_at', { ascending: false });

  const termsData = terms || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Taxonomies</h2>
        <p className="text-gray-400 mt-2">
          Gérer les catégories et tags de vos sites
        </p>
      </div>

      {/* Actions rapides */}
      <div className="mb-6 flex space-x-3">
        <Link 
          href="/admin/terms/new?type=category"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouvelle catégorie
        </Link>
        <Link 
          href="/admin/terms/new?type=tag"
          className="px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-900"
        >
          Nouveau tag
        </Link>
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="flex space-x-8">
          <button className="border-b-2 border-blue-600 pb-3 px-1 text-sm font-medium text-blue-600">
            Tous
          </button>
          <button className="border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-200">
            Catégories
          </button>
          <button className="border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-200">
            Tags
          </button>
        </nav>
      </div>

      {/* Liste */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {termsData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Aucune taxonomie créée pour le moment.</p>
            <Link 
              href="/admin/terms/new?type=category"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer votre première catégorie
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {termsData.map((term: any) => (
                  <tr key={term.id} className="hover:bg-gray-900">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{term.name}</div>
                      {term.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{term.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        term.type === 'category' 
                          ? 'bg-blue-900/20 text-blue-400' 
                          : 'bg-gray-800 text-gray-800'
                      }`}>
                        {term.type === 'category' ? 'Catégorie' : 'Tag'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {term.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {term.site.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/terms/${term.id}`}
                        className="text-blue-600 hover:text-blue-700 mr-4"
                      >
                        Modifier
                      </Link>
                      <button className="text-red-600 hover:text-red-700">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

