'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PageEnrichmentProposal } from '@/lib/services/ai/enrichPagesComplete';

interface Props {
  siteId: string;
}

export default function PagesEnhanceTab({ siteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<'fill_only_empty' | 'overwrite'>('fill_only_empty');
  const [proposals, setProposals] = useState<PageEnrichmentProposal[]>([]);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch(`/api/admin/sites/${siteId}/enhance/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de génération');
      }

      const data = await res.json();
      setProposals(data.proposals);
      setAiJobId(data.aiJobId);
      
      // Select all by default
      setSelected(new Set(data.proposals.map((p: any) => p.page_id)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!aiJobId || selected.size === 0) return;

    try {
      setApplying(true);
      setError(null);

      const selectedProposals = proposals.filter((p) => selected.has(p.page_id));

      const res = await fetch(`/api/admin/sites/${siteId}/enhance/pages/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiJobId,
          selectedProposals,
          mode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur d\'application');
      }

      const data = await res.json();
      setSuccess(true);
      setProposals([]);
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  }

  function toggleSelected(pageId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === proposals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proposals.map((p) => p.page_id)));
    }
  }

  function getPageTypeLabel(slug: string): string {
    const labels: Record<string, string> = {
      'a-propos': 'À propos',
      'contact': 'Contact',
      'mentions-legales': 'Mentions légales',
      'politique-de-confidentialite': 'Politique de confidentialité',
      'conditions-generales-utilisation': 'CGU',
    };
    return labels[slug] || slug;
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mode d'application
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode('fill_only_empty')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'fill_only_empty'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Remplir uniquement vide (sûr)
            </button>
            <button
              onClick={() => setMode('overwrite')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'overwrite'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Écraser tout
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {mode === 'fill_only_empty'
              ? 'Ne modifie que les pages vides (recommandé)'
              : '⚠️ Remplace tous les contenus, même ceux déjà remplis'}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {loading ? 'Génération en cours...' : 'Prévisualiser'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {success && aiJobId && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="text-green-400 font-medium mb-2">
            ✓ Enrichissement appliqué avec succès !
          </div>
          <Link
            href={`/admin/sites/${siteId}/ai-jobs/${aiJobId}`}
            className="text-sm text-green-300 hover:text-green-200 underline"
          >
            Voir les détails du job IA →
          </Link>
        </div>
      )}

      {/* Proposals */}
      {proposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Aperçu ({selected.size}/{proposals.length} sélectionnés)
            </h3>
            <div className="flex gap-3">
              <button
                onClick={toggleAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {selected.size === proposals.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={handleApply}
                disabled={applying || selected.size === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
              >
                {applying ? 'Application...' : `Appliquer (${selected.size})`}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.page_id}
                className={`bg-gray-900 border rounded-lg p-4 ${
                  selected.has(proposal.page_id)
                    ? 'border-blue-500'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selected.has(proposal.page_id)}
                    onChange={() => toggleSelected(proposal.page_id)}
                    className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-semibold text-white">
                          {proposal.title}
                        </h4>
                        <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                          {getPageTypeLabel(proposal.slug)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        slug: {proposal.slug} · {proposal.wordCount} mots
                      </div>
                    </div>

                    {/* Current content */}
                    {proposal.currentContentHtml && (
                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">
                          Contenu actuel
                        </div>
                        <div className="p-3 bg-gray-800 rounded text-sm text-gray-400 max-h-60 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: proposal.currentContentHtml }} />
                        </div>
                      </div>
                    )}

                    {/* Proposed content */}
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">
                        Contenu proposé
                      </div>
                      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200 max-h-60 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: proposal.proposedContentHtml }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
