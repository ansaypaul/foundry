'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NewContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'post';
  
  const [type, setType] = useState<'post' | 'page'>(typeParam as 'post' | 'page');
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger les sites
    fetch('/api/admin/sites')
      .then(res => res.json())
      .then(data => setSites(data.sites || []))
      .catch(err => console.error('Error loading sites:', err));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: formData.get('site_id'),
          type: formData.get('type'),
          title: formData.get('title'),
          slug: formData.get('slug'),
          excerpt: formData.get('excerpt'),
          content_html: formData.get('content_html'),
          status: formData.get('status'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const { content } = await response.json();
      
      // Rediriger vers la page d'édition
      router.push(`/admin/content/${content.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/content" 
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Retour au contenu
        </Link>
        <h2 className="text-3xl font-bold text-white mt-2">
          Créer {type === 'post' ? 'un article' : 'une page'}
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type de contenu *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="post"
                  checked={type === 'post'}
                  onChange={(e) => setType(e.target.value as 'post')}
                  className="mr-2"
                />
                <span className="text-white">Article</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="page"
                  checked={type === 'page'}
                  onChange={(e) => setType(e.target.value as 'page')}
                  className="mr-2"
                />
                <span className="text-white">Page</span>
              </label>
            </div>
          </div>

          {/* Site */}
          <div>
            <label htmlFor="site_id" className="block text-sm font-medium text-gray-300 mb-2">
              Site *
            </label>
            <select
              id="site_id"
              name="site_id"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionnez un site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Titre *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Le titre de votre contenu"
              onBlur={(e) => {
                const slugInput = document.getElementById('slug') as HTMLInputElement;
                if (slugInput && !slugInput.value) {
                  slugInput.value = generateSlug(e.target.value);
                }
              }}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
              Slug (URL) *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="mon-super-article"
            />
            <p className="mt-1 text-sm text-gray-400">
              Le slug sera généré automatiquement depuis le titre, mais vous pouvez le modifier.
            </p>
          </div>

          {/* Extrait */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-300 mb-2">
              Extrait
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Un court résumé de votre contenu..."
            />
          </div>

          {/* Contenu HTML */}
          <div>
            <label htmlFor="content_html" className="block text-sm font-medium text-gray-300 mb-2">
              Contenu HTML
            </label>
            <textarea
              id="content_html"
              name="content_html"
              rows={15}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="<p>Votre contenu en HTML...</p>"
            />
            <p className="mt-1 text-sm text-gray-400">
              HTML autorisé : p, h2, h3, strong, em, ul, li
            </p>
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
              Statut
            </label>
            <select
              id="status"
              name="status"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="draft"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-700">
          <Link
            href="/admin/content"
            className="px-4 py-2 text-sm text-gray-200 hover:text-white"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}

