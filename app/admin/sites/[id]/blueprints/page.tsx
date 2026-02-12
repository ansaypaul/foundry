import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listSiteBlueprints } from '@/lib/services/blueprint/buildSiteBlueprint';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlueprintsListPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const blueprints = await listSiteBlueprints(id);

  return (
    <div>
      <div className="mb-8">
        <Link 
          href={`/admin/sites/${id}/blueprint`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour au blueprint
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Historique des blueprints</h1>
        <p className="text-gray-400 mt-2">
          Toutes les versions sauvegardées pour {site.name}
        </p>
      </div>

      {blueprints.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Aucun blueprint enregistré</p>
          <Link
            href={`/admin/sites/${id}/blueprint`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer le premier blueprint
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blueprints.map((bp) => (
            <div
              key={bp.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      Version {bp.version}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-blue-900/50 text-blue-200 rounded">
                      {new Date(bp.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {bp.notes && (
                    <p className="text-sm text-gray-300 mb-2">{bp.notes}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Créé le {new Date(bp.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <Link
                  href={`/admin/sites/${id}/blueprints/${bp.version}`}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
