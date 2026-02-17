import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlueprintByVersion } from '@/lib/services/blueprint/buildSiteBlueprint';

interface PageProps {
  params: Promise<{ id: string; version: string }>;
}

export default async function BlueprintVersionPage({ params }: PageProps) {
  const { id, version } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const versionNum = parseInt(version, 10);
  const blueprint = await getBlueprintByVersion(id, versionNum);

  if (!blueprint) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          href={`/admin/sites/${id}/blueprints`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour aux versions
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">
          Blueprint v{versionNum}
        </h1>
        <p className="text-gray-400 mt-2">
          Généré le {new Date(blueprint.generatedAt).toLocaleString('fr-FR')}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Résumé</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Auteurs</div>
            <div className="text-white font-medium text-2xl">{blueprint.authors.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Catégories</div>
            <div className="text-white font-medium text-2xl">{blueprint.taxonomy.categories.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Pages</div>
            <div className="text-white font-medium text-2xl">{blueprint.pages.length}</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <details className="bg-gray-800 border border-gray-700 rounded-lg p-4" open>
          <summary className="cursor-pointer text-white font-medium mb-3">
            Auteurs ({blueprint.authors.length})
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blueprint.authors.map((a, i) => (
              <div key={i} className="p-3 bg-gray-700 rounded">
                <div className="font-medium text-white">{a.displayName}</div>
                <div className="text-xs text-gray-400">{a.roleKey}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {a.specialties.map((s, j) => (
                    <span key={j} className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

        <details className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <summary className="cursor-pointer text-white font-medium mb-3">
            Catégories ({blueprint.taxonomy.categories.length})
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {blueprint.taxonomy.categories.map((c, i) => (
              <div key={i} className="p-2 bg-gray-700 rounded text-sm">
                <div className="text-white">{c.name}</div>
                <div className="text-xs text-gray-400">{c.slug}</div>
              </div>
            ))}
          </div>
        </details>

        <details className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <summary className="cursor-pointer text-white font-medium mb-3">
            Pages ({blueprint.pages.length})
          </summary>
          <div className="space-y-2">
            {blueprint.pages.map((p, i) => (
              <div key={i} className="p-2 bg-gray-700 rounded text-sm flex justify-between">
                <span className="text-white">{p.title}</span>
                <span className="text-gray-400">{p.type}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Full JSON */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">JSON complet</h2>
        <pre className="p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
          {JSON.stringify(blueprint, null, 2)}
        </pre>
      </div>
    </div>
  );
}
