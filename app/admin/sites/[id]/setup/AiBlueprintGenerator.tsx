'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlueprintTemplateV1 } from '@/lib/services/blueprint/blueprintTemplateSchema';

interface Props {
  siteId: string;
}

export default function AiBlueprintGenerator({ siteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [template, setTemplate] = useState<BlueprintTemplateV1 | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);

  // Check if site can be reset
  useEffect(() => {
    async function checkResetEligibility() {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/blueprint/reset`);
        if (res.ok) {
          const data = await res.json();
          setCanReset(data.canReset);
          setPublishedCount(data.publishedCount);
        }
      } catch (err) {
        console.error('Failed to check reset eligibility:', err);
      }
    }
    checkResetEligibility();
  }, [siteId]);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setTemplate(null);

      const res = await fetch(`/api/admin/sites/${siteId}/blueprint/generate-template`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de génération');
      }

      const data = await res.json();
      setTemplate(data.template);
      setJobId(data.jobId);
      setBlueprintId(data.blueprintId);
      setVersion(data.version);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!version) return;

    try {
      setApplying(true);
      setError(null);

      const res = await fetch(`/api/admin/sites/${siteId}/blueprint/apply-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur d\'application');
      }

      const data = await res.json();
      setSuccess(true);
      setTemplate(null);
      
      // Refresh page to update setup UI counts
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🤖</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            AI Blueprint Generator
          </h3>
          <p className="text-gray-300 mb-4">
            Générez automatiquement toute la structure de votre site (catégories, auteurs, pages, types de contenu) 
            adaptée à votre niche en un clic.
          </p>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Success */}
          {success && jobId && (
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg mb-4">
              <div className="text-green-400 font-medium mb-2">
                ✓ Blueprint appliqué avec succès !
              </div>
              <div className="text-sm text-green-300 mb-2">
                Vous pouvez maintenant enrichir le contenu avec l'IA dans l'onglet "Enrichissement IA".
              </div>
              <Link
                href={`/admin/sites/${siteId}/ai-jobs/${jobId}`}
                className="text-sm text-green-300 hover:text-green-200 underline"
              >
                Voir les détails du job IA →
              </Link>
            </div>
          )}

          {/* Preview */}
          {template && !success && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <h4 className="text-lg font-semibold text-white mb-3">Aperçu du Blueprint</h4>

              {/* Version Info */}
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-300 font-medium">Blueprint Version {version}</div>
                  <div className="text-xs text-purple-400">ID: {blueprintId?.slice(0, 8)}</div>
                </div>
                <div className="text-xs text-purple-400">
                  Sauvegardé dans site_blueprint
                </div>
              </div>

              {/* Niche Summary */}
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <div className="text-sm text-blue-300 font-medium mb-1">Résumé de niche</div>
                <div className="text-sm text-blue-200">{template.site.nicheSummary}</div>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-2">
                  Catégories ({template.taxonomy.categories.length})
                </div>
                <div className="space-y-1">
                  {template.taxonomy.categories.map((cat, idx) => (
                    <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.priority === 1 ? 'bg-green-500' : cat.priority === 2 ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                      <span>{cat.name}</span>
                      <span className="text-gray-500">({cat.slug})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authors */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-2">
                  Auteurs ({template.authors.length})
                </div>
                <div className="space-y-1">
                  {template.authors.map((author, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      <div className="font-medium">{author.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {author.specialties.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-2">
                  Types de contenu ({template.contentTypes.length})
                </div>
                <div className="space-y-1">
                  {template.contentTypes.map((ct, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      {ct.label} ({ct.rules.minWords} mots min)
                    </div>
                  ))}
                </div>
              </div>

              {/* Pages */}
              <div>
                <div className="text-sm font-medium text-gray-400 mb-2">
                  Pages obligatoires ({template.pages.length})
                </div>
                <div className="space-y-1">
                  {template.pages.map((page, idx) => (
                    <div key={idx} className="text-sm text-gray-300">
                      {page.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!template && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Génération en cours...' : 'Générer la structure avec l\'IA'}
              </button>
            )}

            {template && !success && (
              <>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {applying ? 'Application...' : 'Appliquer ce blueprint'}
                </button>
                <button
                  onClick={() => {
                    setTemplate(null);
                    setError(null);
                  }}
                  disabled={applying}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Régénérer
                </button>
              </>
            )}

            {/* Reset button (only for empty sites) */}
            {!template && !success && (
              <button
                onClick={() => setShowResetModal(true)}
                disabled={!canReset || resetting}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                title={
                  !canReset
                    ? `Reset impossible: ${publishedCount} article(s) publié(s)`
                    : 'Supprimer toute la structure pour recommencer'
                }
              >
                {resetting ? 'Reset en cours...' : 'Reset structure'}
              </button>
            )}
          </div>

          {/* Info message for disabled reset */}
          {!canReset && !template && !success && (
            <div className="mt-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded text-sm text-orange-300">
              ⚠️ Reset impossible: le site contient {publishedCount} article(s) publié(s).
              Le reset n'est autorisé que pour les sites vides.
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmer le reset
            </h3>
            <div className="text-gray-300 mb-6 space-y-3">
              <p>
                Cette action va <strong className="text-red-400">supprimer définitivement</strong> :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Toutes les catégories</li>
                <li>Tous les auteurs</li>
                <li>Toutes les pages (À propos, Contact, etc.)</li>
                <li>Tous les types de contenu</li>
                <li>Les métadonnées SEO associées</li>
              </ul>
              <p className="text-yellow-400 text-sm">
                ⚠️ Cette action est irréversible. Seuls les sites sans contenu publié peuvent être réinitialisés.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                {resetting ? 'Reset...' : 'Oui, supprimer tout'}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleReset() {
    try {
      setResetting(true);
      setError(null);

      const res = await fetch(`/api/admin/sites/${siteId}/blueprint/reset`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors du reset');
      }

      const data = await res.json();
      setShowResetModal(false);
      
      // Show success message
      alert(
        `Structure réinitialisée avec succès !\n\n` +
        `Supprimé:\n` +
        `- ${data.deleted.categories} catégories\n` +
        `- ${data.deleted.authors} auteurs\n` +
        `- ${data.deleted.pages} pages\n` +
        `- ${data.deleted.contentTypes} types de contenu\n` +
        `- ${data.deleted.seoMeta} entrées SEO`
      );

      // Reload page
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setShowResetModal(false);
    } finally {
      setResetting(false);
    }
  }
}
