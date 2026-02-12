'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  siteId: string;
}

export default function EnrichmentOneClickButton({ siteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<any>(null);

  async function handleEnrich() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/sites/${siteId}/enrichment/run-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'fill_only_empty' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur d\'enrichissement');
      }

      const data = await res.json();
      setResults(data.results);
      setSuccess(data.success);

      if (data.success) {
        // Reload page after success
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success && results) {
    return (
      <div>
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg mb-3">
          <div className="text-green-400 font-medium mb-2">
            ✓ Enrichissement terminé avec succès !
          </div>
          <div className="text-sm text-green-300 space-y-1">
            {results.categories.success && (
              <div>• Catégories enrichies → <Link href={`/admin/sites/${siteId}/ai-jobs/${results.categories.jobId}`} className="underline">Job</Link></div>
            )}
            {results.authors.success && (
              <div>• Auteurs enrichis → <Link href={`/admin/sites/${siteId}/ai-jobs/${results.authors.jobId}`} className="underline">Job</Link></div>
            )}
            {results.pages.success && (
              <div>• Pages enrichies → <Link href={`/admin/sites/${siteId}/ai-jobs/${results.pages.jobId}`} className="underline">Job</Link></div>
            )}
          </div>
          <p className="text-xs text-green-300 mt-3">
            Rechargement de la page dans 2 secondes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm mb-3">
          {error}
        </div>
      )}

      {results && !success && (
        <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg text-orange-300 text-sm mb-3">
          <div className="font-medium mb-2">⚠️ Enrichissement partiel</div>
          <div className="space-y-1 text-xs">
            {results.categories.error && <div>• Catégories: {results.categories.error}</div>}
            {results.authors.error && <div>• Auteurs: {results.authors.error}</div>}
            {results.pages.error && <div>• Pages: {results.pages.error}</div>}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleEnrich}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all inline-flex items-center gap-2"
        >
          <span>✨</span>
          <span>{loading ? 'Enrichissement en cours...' : 'Lancer l\'enrichissement complet'}</span>
        </button>
        <Link
          href={`/admin/sites/${siteId}/enhance`}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          Enrichissement manuel
        </Link>
      </div>

      {loading && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="text-sm text-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Enrichissement en cours...</span>
            </div>
            <p className="text-xs text-blue-300">
              Génération des descriptions, biographies et contenus de pages. 
              Cela peut prendre 30-60 secondes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
