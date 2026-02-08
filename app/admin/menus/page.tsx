import { getAllSites } from '@/lib/db/queries';
import { getMenusBySiteId } from '@/lib/db/menus-queries';
import Link from 'next/link';

export default async function MenusPage() {
  const sites = await getAllSites();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Menus</h2>
          <p className="text-gray-400 mt-2">
            Gérer les menus de navigation de vos sites
          </p>
        </div>
        <Link
          href="/admin/menus/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau menu
        </Link>
      </div>

      {/* Liste par site */}
      <div className="space-y-6">
        {sites && sites.length > 0 ? (
          sites.map((site) => (
            <MenusSiteSection key={site.id} site={site} />
          ))
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <p className="text-gray-400">Aucun site créé. Créez un site d'abord.</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function MenusSiteSection({ site }: { site: any }) {
  const menus = await getMenusBySiteId(site.id);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{site.name}</h3>
        <p className="text-sm text-gray-400 mt-1">{menus.length} menu(s)</p>
      </div>

      {menus.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          Aucun menu pour ce site.
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {menus.map((menu) => (
            <div key={menu.id} className="p-6 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
              <div>
                <h4 className="font-medium text-white">{menu.name}</h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-400">
                    Position: {menu.location || 'Non définie'}
                  </span>
                  {menu.items && (
                    <span className="text-sm text-gray-500">
                      • {JSON.parse(menu.items).length} élément(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/admin/menus/${menu.id}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

