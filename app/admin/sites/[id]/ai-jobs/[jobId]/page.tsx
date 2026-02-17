'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AIJob {
  id: string;
  site_id: string;
  kind: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error_code: string | null;
  error_message: string | null;
  retries: number;
  model_used: string | null;
  tokens_used: number | null;
  input_json: any;
  output_json: any;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AIJobDetailPage() {
  const params = useParams();
  const siteId = params.id as string;
  const jobId = params.jobId as string;

  const [job, setJob] = useState<AIJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/ai-jobs/${jobId}`);
        
        if (!res.ok) {
          throw new Error('Job introuvable');
        }

        const data = await res.json();
        setJob(data.job);
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [siteId, jobId]);

  function getStatusBadge(status: string) {
    const styles = {
      done: 'bg-green-900/30 text-green-300 border-green-500/30',
      error: 'bg-red-900/30 text-red-300 border-red-500/30',
      running: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
      pending: 'bg-gray-700 text-gray-300 border-gray-600',
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status === 'done' && '✓ Terminé'}
        {status === 'error' && '✗ Erreur'}
        {status === 'running' && '⏳ En cours'}
        {status === 'pending' && '⏸ En attente'}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-8">
        <div className="text-center">
          <p className="text-gray-400">Job introuvable</p>
          <Link
            href={`/admin/sites/${siteId}/ai-jobs`}
            className="text-blue-400 hover:text-blue-300 mt-4 inline-block"
          >
            ← Retour aux jobs
          </Link>
        </div>
      </div>
    );
  }

  const attempts = job.output_json?.attempts || [];
  const summary = job.output_json?.summary || null;

  return (
    <div className="py-8">
      <Link
        href={`/admin/sites/${siteId}/ai-jobs`}
        className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block"
      >
        ← Retour aux jobs IA
      </Link>

      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {job.input_json?.title || 'Job IA'}
            </h1>
            <p className="text-gray-400">
              {job.kind} · Job ID: {job.id.substring(0, 8)}...
            </p>
          </div>
          {getStatusBadge(job.status)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
          <div>
            <div className="text-xs text-gray-500 mb-1">Retries</div>
            <div className="text-white font-semibold">{job.retries}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Modèle</div>
            <div className="text-white font-semibold">
              {job.model_used || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Créé le</div>
            <div className="text-white text-sm">
              {new Date(job.created_at).toLocaleString('fr-FR')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Terminé le</div>
            <div className="text-white text-sm">
              {job.finished_at
                ? new Date(job.finished_at).toLocaleString('fr-FR')
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Link to article if exists */}
      {summary?.articleId && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-300 font-semibold mb-1">
                ✓ Article créé
              </div>
              <div className="text-sm text-green-200">
                {summary.articleTitle || summary.articleSlug}
              </div>
            </div>
            <Link
              href={`/admin/sites/${siteId}/content/${summary.articleId}`}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Voir l'article →
            </Link>
          </div>
        </div>
      )}

      {/* Error panel */}
      {job.status === 'error' && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-300 mb-3">
            ❌ Erreur détectée
          </h2>
          {job.error_code && (
            <div className="mb-2">
              <span className="text-xs text-red-400 font-mono bg-red-950/50 px-2 py-1 rounded">
                {job.error_code}
              </span>
            </div>
          )}
          <p className="text-red-200 text-sm mb-3">{job.error_message}</p>
          {job.output_json?.failedAfterAllRetries && (
            <div className="text-xs text-red-300 bg-red-950/30 px-3 py-2 rounded mt-3">
              ⚠️ Toutes les tentatives ont échoué ({job.output_json?.attemptsCount || 0} tentatives). 
              Consultez les détails ci-dessous pour voir les erreurs de validation.
            </div>
          )}
        </div>
      )}

      {/* Input panel */}
      <details className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-700/50 transition-colors text-white font-semibold">
          Input (contexte de génération)
        </summary>
        <div className="px-6 py-4 border-t border-gray-700">
          <pre className="text-xs text-gray-300 overflow-auto">
            {JSON.stringify(job.input_json, null, 2)}
          </pre>
        </div>
      </details>

      {/* Attempts panel */}
      {attempts.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Tentatives ({attempts.length})
          </h2>
          <div className="space-y-4">
            {attempts.map((attempt: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">
                      Tentative #{attempt.attemptNumber}
                    </span>
                    {attempt.validation?.valid ? (
                      <span className="px-2 py-1 bg-green-900/30 text-green-300 border border-green-500/30 text-xs rounded">
                        ✓ Valide
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-900/30 text-red-300 border border-red-500/30 text-xs rounded">
                        ✗ Invalide
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(attempt.createdAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>

                {/* Stats */}
                {attempt.validation?.stats && (
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Mots:</span>{' '}
                      <span className="text-white">
                        {attempt.validation.stats.wordCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">H2:</span>{' '}
                      <span className="text-white">
                        {attempt.validation.stats.h2Count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Listes:</span>{' '}
                      <span className="text-white">
                        {attempt.validation.stats.listCount}
                      </span>
                    </div>
                  </div>
                )}

                {/* Validation errors */}
                {attempt.validation?.errors &&
                  attempt.validation.errors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attempt.validation.errors.map(
                        (error: any, errIdx: number) => (
                          <div
                            key={errIdx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-red-400 font-mono text-xs bg-red-950/30 px-2 py-0.5 rounded">
                              {error.code}
                            </span>
                            <span className="text-red-300">{error.message}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                {/* HTML Generated (for debugging) */}
                {attempt.htmlGenerated && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                      🔍 Voir le HTML généré ({attempt.htmlLength || 'N/A'} caractères)
                    </summary>
                    <div className="mt-2 bg-gray-950 border border-gray-700 rounded p-3 overflow-auto max-h-64">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                        {attempt.htmlGenerated}
                      </pre>
                      {attempt.htmlLength > 1000 && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          (Affichant les {1000} premiers caractères sur {attempt.htmlLength} total)
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output panel */}
      {job.output_json && (
        <details className="bg-gray-800 border border-gray-700 rounded-lg">
          <summary className="px-6 py-4 cursor-pointer hover:bg-gray-700/50 transition-colors text-white font-semibold">
            Output complet (JSON brut)
          </summary>
          <div className="px-6 py-4 border-t border-gray-700">
            <pre className="text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(job.output_json, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}
