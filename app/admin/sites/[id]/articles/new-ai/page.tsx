'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ContentType {
  id: string;
  key: string;
  label: string;
  description: string | null;
  // From new registry system
  isEnabled?: boolean;
  hasOverrides?: boolean;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

export default function NewAIArticlePage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [angle, setAngle] = useState('');
  const [contentTypeKey, setContentTypeKey] = useState('');
  const [categorySlug, setCategorySlug] = useState('');

  // Load content types and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [typesRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/sites/${siteId}/content-type-settings`),
          fetch(`/api/admin/sites/${siteId}/terms/categories`),
        ]);

        if (!typesRes.ok || !categoriesRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const [typesData, categoriesData] = await Promise.all([
          typesRes.json(),
          categoriesRes.json(),
        ]);

        // Get content types from new registry
        // Note: Now ALL active types are available by default
        const enabledTypes = (typesData.contentTypes || [])
          .filter((item: any) => item.isEnabled !== false) // Only filter if explicitly disabled
          .map((item: any) => ({
            id: item.contentType.id,
            key: item.contentType.key,
            label: item.contentType.label,
            description: item.contentType.description,
            isEnabled: item.isEnabled,
            hasOverrides: item.hasOverrides,
          }));

        setContentTypes(enabledTypes);
        setCategories(categoriesData.categories || []);

        // Set defaults
        if (enabledTypes.length > 0) {
          setContentTypeKey(enabledTypes[0].key);
        }
        if (categoriesData.categories?.length > 0) {
          setCategorySlug(categoriesData.categories[0].slug);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erreur lors du chargement'
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [siteId]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/sites/${siteId}/articles/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            angle: angle || null,
            contentTypeKey,
            categorySlug,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      // Redirect to article page
      router.push(`/admin/sites/${siteId}/content/${data.article.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la génération'
      );
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href={`/admin/sites/${siteId}`}
        className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block"
      >
        ← Retour au tableau de bord
      </Link>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Créer un article avec l'IA
            </h1>
            <p className="text-gray-400 mt-1">
              L'IA génère un brouillon respectant les règles du type de contenu
              sélectionné
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
            <div className="font-semibold mb-1">Erreur</div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Sujet / Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="ex: Les meilleurs smartphones de 2026"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              L'IA peut optimiser le titre final
            </p>
          </div>

          {/* Angle */}
          <div>
            <label
              htmlFor="angle"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Angle / Perspective{' '}
              <span className="text-gray-500">(optionnel)</span>
            </label>
            <textarea
              id="angle"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              rows={3}
              placeholder="ex: Comparaison pour les gamers, focus sur l'autonomie..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Content Type */}
          <div>
            <label
              htmlFor="contentType"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Type de contenu <span className="text-red-400">*</span>
            </label>
            <select
              id="contentType"
              value={contentTypeKey}
              onChange={(e) => setContentTypeKey(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {contentTypes.map((ct) => (
                <option key={ct.key} value={ct.key}>
                  {ct.label}
                  {ct.description ? ` - ${ct.description}` : ''}
                  {ct.hasOverrides ? ' 🔧' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {contentTypes.find(ct => ct.key === contentTypeKey)?.hasOverrides && (
                <span className="text-purple-400">🔧 Ce type a des overrides personnalisés</span>
              )}
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              id="category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-2xl">ℹ️</div>
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-2">Comment ça marche ?</p>
                <ul className="space-y-1 text-blue-300">
                  <li>• L'IA génère un brouillon complet en quelques secondes</li>
                  <li>
                    • Le contenu respecte automatiquement les règles du type
                    sélectionné
                  </li>
                  <li>
                    • L'article est créé en brouillon (pas de publication auto)
                  </li>
                  <li>• Vous pouvez ensuite l'éditer avant de publier</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={generating || !title || !contentTypeKey || !categorySlug}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Génération en cours...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Générer un brouillon
                </>
              )}
            </button>
            <Link
              href={`/admin/sites/${siteId}`}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {/* No data warnings */}
      {!loading && contentTypes.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200">
          <p className="font-semibold mb-1">⚠️ Aucun type de contenu disponible</p>
          <p className="text-sm mb-3">
            Aucun type de contenu n'est actuellement activé au niveau global.
          </p>
          <Link
            href={`/admin/editorial-content-types`}
            className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Gérer les types globaux →
          </Link>
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-200">
          <p className="font-semibold mb-1">⚠️ Aucune catégorie</p>
          <p className="text-sm">
            Vous devez d'abord créer des catégories dans la configuration du
            site.
          </p>
        </div>
      )}
    </div>
  );
}
