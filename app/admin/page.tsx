import { getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getContentStats } from '@/lib/db/queries';
import Link from 'next/link';

export default async function AdminDashboard() {
  // Get all sites with domains
  const supabase = getSupabaseAdmin();
  const { data: sites } = await supabase
    .from('sites')
    .select(`
      *,
      domains (hostname, is_primary)
    `)
    .order('created_at', { ascending: false });
  
  const sitesData = sites || [];
  
  // Get content stats
  const { totalPosts, totalPages, publishedPosts } = await getContentStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Tableau de bord</h2>
        <p className="text-gray-400 mt-2">
          Vue d'ensemble de votre plateforme Foundry
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-1">Sites actifs</div>
          <div className="text-3xl font-bold text-white">{sitesData?.length || 0}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-1">Articles</div>
          <div className="text-3xl font-bold text-white">{totalPosts}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-1">Pages</div>
          <div className="text-3xl font-bold text-white">{totalPages}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-sm text-gray-400 mb-1">Publiés</div>
          <div className="text-3xl font-bold text-white">{publishedPosts}</div>
        </div>
      </div>

      {/* Sites List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Sites</h3>
          <Link 
            href="/admin/sites/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nouveau site
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {sitesData.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              Aucun site créé pour le moment.
            </div>
          ) : (
            sitesData.map((site: any) => (
              <div key={site.id} className="p-6 flex items-center justify-between hover:bg-gray-750 transition-colors">
                <div>
                  <h4 className="font-semibold text-white">{site.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Thème: {site.theme_key} • Statut: {site.status}
                  </p>
                </div>
                <div className="flex space-x-3">
                  {site.domains && site.domains.length > 0 && (
                    <a 
                      href={`http://${site.domains.find((d: any) => d.is_primary)?.hostname || site.domains[0].hostname}:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-400 hover:text-green-300 transition-colors"
                    >
                      Voir →
                    </a>
                  )}
                  <Link 
                    href={`/admin/sites/${site.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Gérer →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/admin/content/new?type=post"
          className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all"
        >
          <h4 className="font-semibold text-white mb-2">Nouvel article</h4>
          <p className="text-sm text-gray-400">
            Créer un nouvel article de blog
          </p>
        </Link>
        <Link 
          href="/admin/content/new?type=page"
          className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all"
        >
          <h4 className="font-semibold text-white mb-2">Nouvelle page</h4>
          <p className="text-sm text-gray-400">
            Créer une nouvelle page statique
          </p>
        </Link>
        <Link 
          href="/admin/media"
          className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all"
        >
          <h4 className="font-semibold text-white mb-2">Upload média</h4>
          <p className="text-sm text-gray-400">
            Ajouter des images ou fichiers
          </p>
        </Link>
      </div>
    </div>
  );
}
