'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AIJob {
  id: string;
  kind: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error_code: string | null;
  error_message: string | null;
  retries: number;
  input_json: any;
  output_json: any;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AIJobsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');

  useEffect(() => {
    async function loadJobs() {
      try {
        const url = `/api/admin/sites/${siteId}/ai-jobs?status=${statusFilter}&kind=${kindFilter}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Erreur lors du chargement');
        }

        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [siteId, statusFilter, kindFilter]);

  function getStatusBadge(status: string) {
    const styles = {
      done: 'bg-green-900/30 text-green-300 border-green-500/30',
      error: 'bg-red-900/30 text-red-300 border-red-500/30',
      running: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
      pending: 'bg-gray-700 text-gray-300 border-gray-600',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
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

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <Link
          href={`/admin/sites/${siteId}`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Jobs IA</h1>
        <p className="text-gray-400 mt-2">
          Historique des générations d'articles par IA
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Type</label>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="article_generate">Articles</option>
            <option value="enrich_categories">Enrichissement catégories</option>
            <option value="enrich_authors">Enrichissement auteurs</option>
            <option value="enrich_pages">Enrichissement pages</option>
            <option value="generate_blueprint_template">Génération blueprint</option>
            <option value="content_rewrite">Réécriture</option>
            <option value="seo_optimize">Optimisation SEO</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous</option>
            <option value="done">Terminé</option>
            <option value="error">Erreur</option>
            <option value="running">En cours</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-gray-400">Aucun job IA pour ce filtre</p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Titre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                    Retries
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Erreur
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">
                        {job.input_json?.title || 'Sans titre'}
                      </div>
                      {job.input_json?.contentType?.label && (
                        <div className="text-xs text-gray-500 mt-1">
                          {job.input_json.contentType.label}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">
                        {job.kind === 'article_generate' && 'Article'}
                        {job.kind === 'enrich_categories' && 'Enrichissement catégories'}
                        {job.kind === 'enrich_authors' && 'Enrichissement auteurs'}
                        {job.kind === 'enrich_pages' && 'Enrichissement pages'}
                        {job.kind === 'generate_blueprint_template' && 'Génération blueprint'}
                        {job.kind === 'content_rewrite' && 'Réécriture'}
                        {job.kind === 'seo_optimize' && 'Optimisation SEO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-white">{job.retries}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">
                        {formatDate(job.finished_at || job.updated_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {job.error_code && (
                        <div className="text-xs">
                          <span className="text-red-400 font-mono">
                            {job.error_code}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/sites/${siteId}/ai-jobs/${job.id}`}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                        >
                          Détails
                        </Link>
                        {job.output_json?.summary?.articleId && (
                          <Link
                            href={`/admin/sites/${siteId}/content/${job.output_json.summary.articleId}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                          >
                            Voir article
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
