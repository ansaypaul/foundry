'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, ErrorMessage, SuccessMessage } from '@/app/admin/components/FormComponents';
import Link from 'next/link';

interface PagePlan {
  key: string;
  title: string;
  slug: string;
  status: string;
}

interface PagesPreview {
  profile: {
    siteSize: string;
    targetCount: number;
  };
  plan: PagePlan[];
  existingCount: number;
  missingPages: PagePlan[];
}

export default function MandatoryPagesSetup({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PagesPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function loadPreview() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sites/${siteId}/setup/pages`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function applyPlan() {
    try {
      setApplying(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/sites/${siteId}/setup/pages`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Reload preview
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pages essentielles</h3>
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const hasExistingPages = preview.existingCount > 0;
  const hasMissingPages = preview.missingPages.length > 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Pages essentielles</h3>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Blueprint Source */}
      {(preview as any).source && (
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-200">
            📋 Source: {(preview as any).source}
          </p>
        </div>
      )}

      {/* Profile Summary */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Taille du site</div>
            <div className="text-white font-medium capitalize">{preview.profile.siteSize}</div>
          </div>
          <div>
            <div className="text-gray-400">Pages recommandées</div>
            <div className="text-white font-medium">{preview.plan.length}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      {hasExistingPages && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            ✓ {preview.existingCount} page(s) déjà créée(s)
          </p>
        </div>
      )}

      {/* Pages Plan Preview */}
      {hasMissingPages ? (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-3">
              Pages à créer ({preview.missingPages.length})
            </h4>
            <div className="space-y-2">
              {preview.missingPages.map((page, idx) => (
                <div key={idx} className="p-3 bg-gray-700 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{page.title}</div>
                    <div className="text-xs text-gray-400 mt-1">/{page.slug}</div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                    {page.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryButton onClick={applyPlan} disabled={applying}>
              {applying ? 'Création...' : 'Créer les pages'}
            </PrimaryButton>
            <SecondaryButton onClick={loadPreview} disabled={applying}>
              Rafraîchir
            </SecondaryButton>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-400 mb-4">✓ Toutes les pages essentielles sont créées</p>
          <Link
            href={`/admin/sites/${siteId}/pages`}
            className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Gérer les pages
          </Link>
        </div>
      )}

      {/* Full Plan (collapsed) */}
      {preview.plan.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            Voir le plan complet ({preview.plan.length} pages)
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            {preview.plan.map((page, idx) => (
              <div key={idx} className="text-gray-400">
                • {page.title} <span className="text-gray-600">({page.slug})</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
