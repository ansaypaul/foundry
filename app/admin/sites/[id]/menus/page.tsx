import { getSiteById } from '@/lib/db/queries';
import { getMenusBySiteId } from '@/lib/db/menus-queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteMenusPage({ params }: PageProps) {
  const { id } = await params;
  const [site, menus] = await Promise.all([
    getSiteById(id),
    getMenusBySiteId(id),
  ]);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Menus</h1>
          <p className="text-gray-400 mt-2">Gérer les menus de {site.name}</p>
        </div>
        <Link
          href={`/admin/sites/${id}/menus/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouveau menu
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Aucun menu créé</p>
          <Link
            href={`/admin/sites/${id}/menus/new`}
            className="text-blue-400 hover:text-blue-300"
          >
            Créer votre premier menu →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{menu.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-gray-400">
                      {menu.location === 'header' && 'Header'}
                      {menu.location === 'footer' && 'Footer'}
                      {menu.location === 'sidebar' && 'Sidebar'}
                    </span>
                    {menu.items && (
                      <span className="text-sm text-gray-500">
                        • {JSON.parse(menu.items).length} élément(s)
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/sites/${id}/menus/${menu.id}`}
                  className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
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
