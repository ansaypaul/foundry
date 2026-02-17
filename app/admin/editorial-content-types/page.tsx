import { getSupabaseAdmin } from '@/lib/db/client';
import Link from 'next/link';
import { listAllContentTypes } from '@/lib/services/contentTypes/contentTypeRegistry';

export default async function EditorialContentTypesPage() {
  const contentTypes = await listAllContentTypes();
  
  const activeTypes = contentTypes.filter(ct => ct.is_active);
  const inactiveTypes = contentTypes.filter(ct => !ct.is_active);
  const systemTypes = contentTypes.filter(ct => ct.is_system);
  const customTypes = contentTypes.filter(ct => !ct.is_system);
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Types de contenu éditoriaux</h1>
        <p className="text-gray-400 mt-2">
          Gérez les templates, prompts et règles de validation des types d'articles
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-2xl font-bold text-white">{contentTypes.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Actifs</div>
          <div className="text-2xl font-bold text-green-400">{activeTypes.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Système</div>
          <div className="text-2xl font-bold text-blue-400">{systemTypes.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Custom</div>
          <div className="text-2xl font-bold text-purple-400">{customTypes.length}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <Link
          href="/admin/editorial-content-types/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <span>+</span>
          <span>Nouveau type de contenu</span>
        </Link>
      </div>

      {/* Content Types Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Mots min
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {contentTypes.map((ct) => (
              <tr key={ct.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm text-purple-300">{ct.key}</code>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white font-medium">{ct.label}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-400 max-w-xs truncate">
                    {ct.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ct.is_system ? (
                    <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded border border-blue-500/30">
                      Système
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded border border-purple-500/30">
                      Custom
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ct.is_active ? (
                    <span className="px-2 py-1 text-xs bg-green-600/20 text-green-300 rounded border border-green-500/30">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-600/20 text-gray-400 rounded border border-gray-500/30">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {ct.validator_profile?.min_words || '-'} mots
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/admin/editorial-content-types/${ct.key}/edit`}
                    className="text-blue-400 hover:text-blue-300 mr-4"
                  >
                    Éditer
                  </Link>
                  <Link
                    href={`/admin/editorial-content-types/${ct.key}`}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contentTypes.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">Aucun type de contenu trouvé</p>
          <p className="text-sm text-gray-500">
            Exécutez le seed SQL : <code className="text-purple-300">seed-editorial-content-types.sql</code>
          </p>
        </div>
      )}
    </div>
  );
}
