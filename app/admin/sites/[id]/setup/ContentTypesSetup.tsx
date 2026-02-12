'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, ErrorMessage, SuccessMessage } from '@/app/admin/components/FormComponents';

interface ContentTypePlan {
  key: string;
  label: string;
  description?: string;
  rules: {
    minWords: number;
    h2Min: number;
    maxSingleItemLists: boolean;
    allowHtmlTags: string[];
    noEmojis: boolean;
    noLongDash: boolean;
  };
}

interface ContentTypesPreview {
  profile: {
    siteSize: string;
    targetCount: number;
  };
  plan: ContentTypePlan[];
  existingCount: number;
  missingContentTypes: ContentTypePlan[];
}

export default function ContentTypesSetup({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ContentTypesPreview | null>(null);
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
      const response = await fetch(`/api/admin/sites/${siteId}/setup/content-types`);
      
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

      const response = await fetch(`/api/admin/sites/${siteId}/setup/content-types`, {
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
        <h3 className="text-lg font-semibold text-white mb-4">Types de contenu</h3>
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const hasExistingTypes = preview.existingCount > 0;
  const hasMissingTypes = preview.missingContentTypes.length > 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Types de contenu</h3>

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
            <div className="text-gray-400">Types recommandés</div>
            <div className="text-white font-medium">{preview.plan.length}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      {hasExistingTypes && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            ✓ {preview.existingCount} type(s) déjà créé(s)
          </p>
        </div>
      )}

      {/* Content Types Plan Preview */}
      {hasMissingTypes ? (
        <>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-3">
              Types à créer ({preview.missingContentTypes.length})
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {preview.missingContentTypes.map((type, idx) => (
                <div key={idx} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white">{type.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{type.key}</div>
                      {type.description && (
                        <div className="text-sm text-gray-300 mt-1">{type.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-gray-600">
                    <div>
                      <div className="text-gray-400">Mots minimum</div>
                      <div className="text-white font-medium">
                        {type.rules.minWords}+
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Sections H2</div>
                      <div className="text-white font-medium">
                        {type.rules.h2Min}+
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryButton onClick={applyPlan} disabled={applying}>
              {applying ? 'Création...' : 'Créer les types'}
            </PrimaryButton>
            <SecondaryButton onClick={loadPreview} disabled={applying}>
              Rafraîchir
            </SecondaryButton>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-400 mb-4">✓ Tous les types de contenu sont créés</p>
        </div>
      )}

      {/* Full Plan (collapsed) */}
      {preview.plan.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            Voir le plan complet ({preview.plan.length} types)
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            {preview.plan.map((type, idx) => (
              <div key={idx} className="text-gray-400">
                • {type.label} <span className="text-gray-600">({type.key})</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
