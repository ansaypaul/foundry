import { getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { Content, Site } from '@/lib/db/types';
import Link from 'next/link';

export default async function ContentPage() {
  const supabase = getSupabaseAdmin();
  
  // Récupérer tous les sites pour le filtre
  const sites = await getAllSites();
  
  // Récupérer tout le contenu
  const { data: content, error } = await supabase
    .from('content')
    .select(`
      *,
      site:sites(name)
    `)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching content:', error);
  }

  const contentData = (content || []) as (Content & { site: { name: string } })[];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Contenu</h2>
          <p className="text-gray-400 mt-2">
            Gérer tous vos articles et pages
          </p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/admin/content/new?type=post"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nouvel article
          </Link>
          <Link 
            href="/admin/content/new?type=page"
            className="px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-900"
          >
            Nouvelle page
          </Link>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex space-x-2">
          <button className="px-4 py-2 text-sm bg-blue-900/20 text-blue-400 rounded-lg">
            Tous
          </button>
          <button className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">
            Articles
          </button>
          <button className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">
            Pages
          </button>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">
            Publiés
          </button>
          <button className="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">
            Brouillons
          </button>
        </div>
      </div>

      {/* Liste du contenu */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {contentData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Aucun contenu créé pour le moment.</p>
            <Link 
              href="/admin/content/new?type=post"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer votre premier article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-900">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {item.title}
                          </div>
                          {item.excerpt && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {item.excerpt}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.type === 'post' 
                          ? 'bg-purple-900/20 text-purple-400' 
                          : 'bg-gray-800 text-gray-800'
                      }`}>
                        {item.type === 'post' ? 'Article' : 'Page'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.site.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'published' 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/content/${item.id}`}
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

