'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          theme_key: formData.get('theme_key'),
          status: formData.get('status'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du site');
      }

      const { site } = await response.json();
      
      // Rediriger vers la page d'édition du site pour ajouter des domaines
      router.push(`/admin/sites/${site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/sites" 
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Retour aux sites
        </Link>
        <h2 className="text-3xl font-bold text-white mt-2">Créer un nouveau site</h2>
        <p className="text-gray-400 mt-2">
          Créez un nouveau site éditorial. Vous pourrez ajouter des domaines après la création.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="space-y-6">
          {/* Nom du site */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
              Nom du site *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mon Super Site"
            />
            <p className="mt-1 text-sm text-gray-500">
              Le nom du site tel qu'il apparaîtra dans l'admin et sur le site public.
            </p>
          </div>

          {/* Thème */}
          <div>
            <label htmlFor="theme_key" className="block text-sm font-medium text-gray-200 mb-2">
              Thème
            </label>
            <select
              id="theme_key"
              name="theme_key"
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="default"
            >
              <option value="default">Thème par défaut</option>
              <option value="minimal">Minimal</option>
              <option value="magazine">Magazine</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Le thème définit l'apparence visuelle du site.
            </p>
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-200 mb-2">
              Statut
            </label>
            <select
              id="status"
              name="status"
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="active"
            >
              <option value="active">Actif</option>
              <option value="paused">En pause</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Un site en pause ne sera pas accessible publiquement.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-700">
          <Link
            href="/admin/sites"
            className="px-4 py-2 text-sm text-gray-200 hover:text-white"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Création...' : 'Créer le site'}
          </button>
        </div>
      </form>
    </div>
  );
}

