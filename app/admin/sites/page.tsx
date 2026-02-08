import { getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { Site } from '@/lib/db/types';
import Link from 'next/link';

interface SiteWithDomains extends Site {
  domains: Array<{
    id: string;
    hostname: string;
    is_primary: boolean;
    redirect_to_primary: boolean;
  }>;
}

export default async function SitesPage() {
  // Get all sites with their domains using Supabase
  const supabase = getSupabaseAdmin();
  const { data: sites, error } = await supabase
    .from('sites')
    .select(`
      *,
      domains (
        id,
        hostname,
        is_primary,
        redirect_to_primary
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sites:', error);
  }

  const sitesData = (sites || []) as SiteWithDomains[];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Sites</h2>
          <p className="text-gray-400 mt-2">
            Gérer tous vos sites éditoriaux
          </p>
        </div>
        <Link 
          href="/admin/sites/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouveau site
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {sitesData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Aucun site créé pour le moment.</p>
            <Link 
              href="/admin/sites/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Créer votre premier site
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sitesData.map((site) => (
              <div key={site.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {site.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        site.status === 'active' 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-gray-800 text-gray-800'
                      }`}>
                        {site.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Thème: <span className="font-medium">{site.theme_key}</span>
                    </p>
                    
                    {/* Domains */}
                    {site.domains && site.domains.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Domaines:</p>
                        <div className="flex flex-wrap gap-2">
                          {site.domains.map((domain) => (
                            <span 
                              key={domain.id}
                              className={`px-3 py-1 text-sm rounded ${
                                domain.is_primary
                                  ? 'bg-blue-900/20 text-blue-400 font-medium'
                                  : 'bg-gray-800 text-gray-200'
                              }`}
                            >
                              {domain.hostname}
                              {domain.is_primary && ' (principal)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 ml-6">
                    {site.domains && site.domains.length > 0 && (
                      <a 
                        href={`http://${site.domains.find(d => d.is_primary)?.hostname || site.domains[0].hostname}:3000`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50"
                      >
                        Voir le site →
                      </a>
                    )}
                    <Link 
                      href={`/admin/sites/${site.id}`}
                      className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-gray-900"
                    >
                      Modifier
                    </Link>
                    <Link 
                      href={`/admin/sites/${site.id}/content`}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Contenu
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

