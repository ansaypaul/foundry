'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, ErrorMessage, SuccessMessage } from '@/app/admin/components/FormComponents';
import Link from 'next/link';

interface CategoryPlan {
  name: string;
  slug: string;
  intent: string;
  priority: number;
}

interface TaxonomyPreview {
  profile: {
    siteSize: string;
    targetCount: number;
  };
  plan: CategoryPlan[];
  existingCount: number;
  missingCategories: CategoryPlan[];
}

export default function TaxonomySetup({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<TaxonomyPreview | null>(null);
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
      const response = await fetch(`/api/admin/sites/${siteId}/setup/taxonomy`);
      
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

      const response = await fetch(`/api/admin/sites/${siteId}/setup/taxonomy`, {
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
        <h3 className="text-lg font-semibold text-white mb-4">Catégories</h3>
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const hasExistingCategories = preview.existingCount > 0;
  const hasMissingCategories = preview.missingCategories.length > 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Taxonomie (Catégories)</h3>

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
            <div className="text-gray-400">Objectif catégories</div>
            <div className="text-white font-medium">{preview.profile.targetCount}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      {hasExistingCategories && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            ✓ {preview.existingCount} catégorie(s) déjà créée(s)
          </p>
        </div>
      )}

      {/* Categories Plan Preview */}
      {hasMissingCategories ? (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-3">
              Catégories à créer ({preview.missingCategories.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {preview.missingCategories.map((cat, idx) => (
                <div key={idx} className="p-3 bg-gray-700 rounded-lg">
                  <div className="font-medium text-white">{cat.name}</div>
                  <div className="text-xs text-gray-400 mt-1">/{cat.slug}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryButton onClick={applyPlan} disabled={applying}>
              {applying ? 'Création...' : 'Créer les catégories'}
            </PrimaryButton>
            <SecondaryButton onClick={loadPreview} disabled={applying}>
              Rafraîchir
            </SecondaryButton>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-400 mb-4">✓ Toutes les catégories sont créées</p>
          <Link
            href={`/admin/sites/${siteId}/terms?type=category`}
            className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Gérer les catégories
          </Link>
        </div>
      )}

      {/* Full Plan (collapsed) */}
      {preview.plan.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            Voir le plan complet ({preview.plan.length} catégories)
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2 pl-4">
            {preview.plan.map((cat, idx) => (
              <div key={idx} className="text-gray-400">
                {idx + 1}. {cat.name} <span className="text-gray-600">({cat.slug})</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
