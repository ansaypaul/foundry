'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AuthorEnrichmentProposal } from '@/lib/services/ai/enrichAuthorsComplete';

interface Props {
  siteId: string;
}

export default function AuthorsEnhanceTab({ siteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<'fill_only_empty' | 'overwrite'>('fill_only_empty');
  const [proposals, setProposals] = useState<AuthorEnrichmentProposal[]>([]);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch(`/api/admin/sites/${siteId}/enhance/authors`, {
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
      setSelected(new Set(data.proposals.map((p: any) => p.author_id)));
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

      const selectedProposals = proposals.filter((p) => selected.has(p.author_id));

      const res = await fetch(`/api/admin/sites/${siteId}/enhance/authors/apply`, {
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

  function toggleSelected(authorId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(authorId)) {
        next.delete(authorId);
      } else {
        next.add(authorId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === proposals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proposals.map((p) => p.author_id)));
    }
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
              ? 'Ne modifie que les champs vides (recommandé)'
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
                key={proposal.author_id}
                className={`bg-gray-900 border rounded-lg p-4 ${
                  selected.has(proposal.author_id)
                    ? 'border-blue-500'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selected.has(proposal.author_id)}
                    onChange={() => toggleSelected(proposal.author_id)}
                    className="mt-1 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {proposal.displayName}
                      </h4>
                      <div className="flex gap-2 text-xs">
                        {proposal.roleKey && (
                          <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded">
                            {proposal.roleKey}
                          </span>
                        )}
                        {proposal.specialties.length > 0 && (
                          <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded">
                            {proposal.specialties.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tagline */}
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">
                        Tagline (accroche courte)
                      </div>
                      <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200">
                        <span className="text-xs text-blue-400">Proposé:</span> {proposal.proposedTagline}
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">
                        Biographie (visible sur le site)
                      </div>
                      {proposal.currentBio && (
                        <div className="mb-2 p-3 bg-gray-800 rounded text-sm text-gray-400">
                          <span className="text-xs text-gray-600 block mb-2">Actuel:</span>
                          <div dangerouslySetInnerHTML={{ __html: proposal.currentBio }} />
                        </div>
                      )}
                      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200">
                        <span className="text-xs text-blue-400 block mb-2">Proposé:</span>
                        <div dangerouslySetInnerHTML={{ __html: proposal.proposedBioHtml }} />
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
