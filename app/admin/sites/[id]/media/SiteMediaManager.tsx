'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
}

interface Media {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  alt_text?: string;
  created_at: string;
}

export default function SiteMediaManager({ siteId }: Props) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const res = await fetch(`/api/admin/media?site_id=${siteId}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setMedia(data.media || []);
    } catch (err) {
      setError('Impossible de charger les médias');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file || file.size === 0) {
      setError('Sélectionnez un fichier');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('site_id', siteId);
      uploadData.append('alt_text', formData.get('alt_text') as string || '');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur d\'upload');
      }

      setSuccess('Fichier uploadé avec succès !');
      (e.target as HTMLFormElement).reset();
      loadMedia();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(mediaId: string) {
    if (!confirm('Supprimer ce média ?')) return;

    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur de suppression');
      
      setMedia(media.filter(m => m.id !== mediaId));
      setSuccess('Média supprimé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Impossible de supprimer');
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    setSuccess('URL copiée !');
    setTimeout(() => setSuccess(null), 2000);
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Formulaire d'upload */}
      <FormCard>
        <h3 className="text-lg font-semibold text-white mb-4">Upload un fichier</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="file">Fichier *</Label>
            <input
              type="file"
              id="file"
              name="file"
              accept="image/*"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="alt_text">Texte alternatif</Label>
            <input
              type="text"
              id="alt_text"
              name="alt_text"
              placeholder="Description de l'image"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <PrimaryButton type="submit" disabled={uploading}>
            {uploading ? 'Upload en cours...' : 'Upload'}
          </PrimaryButton>
        </form>
      </FormCard>

      {/* Galerie */}
      <FormCard>
        <h3 className="text-lg font-semibold text-white mb-4">Galerie</h3>
        
        {loading ? (
          <p className="text-gray-400 text-center py-8">Chargement...</p>
        ) : media.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucun média pour ce site</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-gray-700 rounded-lg p-3 space-y-2">
                <div className="relative aspect-square bg-gray-800 rounded overflow-hidden">
                  {item.mime_type.startsWith('image/') ? (
                    <Image
                      src={item.url}
                      alt={item.alt_text || item.filename}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      📄
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-300 truncate">{item.filename}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/sites/${siteId}/media/${item.id}`}
                    className="flex-1"
                  >
                    <SecondaryButton
                      type="button"
                      className="w-full text-xs"
                    >
                      ✏️ Éditer
                    </SecondaryButton>
                  </Link>
                  <SecondaryButton
                    type="button"
                    onClick={() => copyToClipboard(item.url)}
                    className="text-xs"
                  >
                    📋
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    ✕
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormCard>
    </div>
  );
}
