'use client';

import { useState, useEffect } from 'react';

interface SeoBootstrapSetupProps {
  siteId: string;
}

interface SeoBootstrapStats {
  siteSeoExists: boolean;
  contentSeoCount: number;
  termSeoCount: number;
  contentMissingCount: number;
  termMissingCount: number;
}

export default function SeoBootstrapSetup({ siteId }: SeoBootstrapSetupProps) {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [stats, setStats] = useState<SeoBootstrapStats | null>(null);
  const [planPreview, setPlanPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadStats();
  }, [siteId]);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/sites/${siteId}/setup/seo-bootstrap`);
      
      if (!res.ok) {
        throw new Error('Erreur de chargement');
      }

      const data = await res.json();
      setStats(data.stats);
      setPlanPreview(data.plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    try {
      setApplying(true);
      setError(null);
      setSuccess(false);

      const res = await fetch(`/api/admin/sites/${siteId}/setup/seo-bootstrap`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la création du SEO');
      }

      const data = await res.json();
      setStats(data.stats);
      setSuccess(true);
      
      // Reload stats after a short delay
      setTimeout(() => {
        loadStats();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🔍</div>
          <h3 className="text-lg font-semibold text-white">SEO minimal (meta + OG)</h3>
        </div>
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const needsBootstrap = !stats.siteSeoExists || 
                         stats.contentMissingCount > 0 || 
                         stats.termMissingCount > 0;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">🔍</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">SEO minimal (meta + OG)</h3>
          <p className="text-sm text-gray-400 mt-1">
            Métadonnées de base pour pages et catégories
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Site defaults */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Site par défaut</span>
            {stats.siteSeoExists ? (
              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-500/30">
                ✓ Configuré
              </span>
            ) : (
              <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-500/30">
                Manquant
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {stats.siteSeoExists ? 'Templates SEO définis' : 'Templates SEO à créer'}
          </div>
        </div>

        {/* Pages */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Pages</span>
            <span className="text-lg font-semibold text-white">
              {stats.contentSeoCount}
              {stats.contentMissingCount > 0 && (
                <span className="text-yellow-400 ml-1">
                  (+{stats.contentMissingCount})
                </span>
              )}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {stats.contentMissingCount > 0
              ? `${stats.contentMissingCount} page(s) sans SEO`
              : 'Toutes les pages ont un SEO'}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Catégories</span>
            <span className="text-lg font-semibold text-white">
              {stats.termSeoCount}
              {stats.termMissingCount > 0 && (
                <span className="text-yellow-400 ml-1">
                  (+{stats.termMissingCount})
                </span>
              )}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {stats.termMissingCount > 0
              ? `${stats.termMissingCount} catégorie(s) sans SEO`
              : 'Toutes les catégories ont un SEO'}
          </div>
        </div>
      </div>

      {/* Preview of what will be created */}
      {needsBootstrap && planPreview && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="text-sm text-blue-300 mb-2 font-medium">
            Ce qui sera créé :
          </div>
          <ul className="text-xs text-blue-200 space-y-1">
            {planPreview.siteSeoWillBeCreated && (
              <li>• Defaults SEO pour le site (templates titre/description)</li>
            )}
            {planPreview.contentSeoToCreate > 0 && (
              <li>• {planPreview.contentSeoToCreate} métadonnée(s) pour les pages</li>
            )}
            {planPreview.termSeoToCreate > 0 && (
              <li>• {planPreview.termSeoToCreate} métadonnée(s) pour les catégories</li>
            )}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
          ✓ SEO minimal créé avec succès !
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {needsBootstrap ? (
          <button
            onClick={handleApply}
            disabled={applying}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            {applying ? 'Création en cours...' : 'Générer le SEO minimal'}
          </button>
        ) : (
          <div className="px-4 py-2 bg-green-900/30 text-green-300 border border-green-500/30 rounded-lg text-sm font-medium">
            ✓ SEO minimal configuré
          </div>
        )}
        
        <button
          onClick={loadStats}
          disabled={loading || applying}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          Actualiser
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-700">
        <div className="text-xs text-gray-400">
          <strong className="text-gray-300">Note:</strong> Cette opération est idempotente.
          Elle ne modifie pas les métadonnées SEO existantes, elle crée uniquement les manquantes.
        </div>
      </div>
    </div>
  );
}
