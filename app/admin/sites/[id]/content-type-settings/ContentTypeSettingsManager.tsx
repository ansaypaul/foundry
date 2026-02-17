'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, ErrorMessage, SuccessMessage } from '@/app/admin/components/FormComponents';
import Link from 'next/link';

interface ContentTypeSetting {
  contentType: {
    id: string;
    key: string;
    label: string;
    description: string | null;
    is_system: boolean;
  };
  settings: any | null;
  isEnabled: boolean;
  hasOverrides: boolean;
}

export default function ContentTypeSettingsManager({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ContentTypeSetting[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [siteId]);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/sites/${siteId}/content-type-settings`);
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      setSettings(data.contentTypes || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnable(contentTypeKey: string, currentlyEnabled: boolean) {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(
        `/api/admin/sites/${siteId}/content-type-settings/${contentTypeKey}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_enabled: !currentlyEnabled }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update');
      }
      
      setSuccess(`Type ${currentlyEnabled ? 'désactivé' : 'activé'} avec succès`);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function initializeAll() {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/admin/sites/${siteId}/content-type-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize_all' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize');
      }
      
      const data = await response.json();
      setSuccess(data.message);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total disponibles</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Activés</div>
            <div className="text-2xl font-bold text-green-400">{stats.enabled}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Désactivés</div>
            <div className="text-2xl font-bold text-gray-400">{stats.disabled}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Avec overrides</div>
            <div className="text-2xl font-bold text-purple-400">{stats.withOverrides}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {settings.length === 0 && (
        <div className="mb-6">
          <PrimaryButton onClick={initializeAll}>
            Initialiser tous les types
          </PrimaryButton>
        </div>
      )}

      {/* Content Types List */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                Overrides
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {settings.map((item) => (
              <tr key={item.contentType.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-purple-300">{item.contentType.key}</code>
                    {item.contentType.is_system && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-300 rounded">
                        Système
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white font-medium mt-1">
                    {item.contentType.label}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-400 max-w-xs truncate">
                    {item.contentType.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {item.isEnabled ? (
                    <span className="px-2 py-1 text-xs bg-green-600/20 text-green-300 rounded border border-green-500/30">
                      Activé
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-600/20 text-gray-400 rounded border border-gray-500/30">
                      Désactivé
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {item.hasOverrides ? (
                    <span className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded border border-purple-500/30">
                      Oui
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleEnable(item.contentType.key, item.isEnabled)}
                    className="text-sm text-blue-400 hover:text-blue-300 mr-4"
                  >
                    {item.isEnabled ? 'Désactiver' : 'Activer'}
                  </button>
                  {item.isEnabled && (
                    <Link
                      href={`/admin/sites/${siteId}/content-type-settings/${item.contentType.key}/edit`}
                      className="text-sm text-gray-400 hover:text-gray-300"
                    >
                      Overrides
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {settings.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">Aucun type de contenu configuré</p>
          <p className="text-sm text-gray-500 mb-4">
            Initialisez les types par défaut pour ce site
          </p>
          <PrimaryButton onClick={initializeAll}>
            Initialiser les types
          </PrimaryButton>
        </div>
      )}

      {/* Link to global admin */}
      <div className="mt-6">
        <Link
          href="/admin/editorial-content-types"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Gérer les types de contenu globaux →
        </Link>
      </div>
    </div>
  );
}
