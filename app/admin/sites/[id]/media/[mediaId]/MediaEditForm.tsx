'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input, Textarea, Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  mediaId: string;
  siteId: string;
  returnUrl?: string;
}

export default function MediaEditForm({ mediaId, siteId, returnUrl }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadMedia();
  }, [mediaId]);

  async function loadMedia() {
    try {
      const response = await fetch(`/api/admin/media/${mediaId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setMedia(data.media);
      setTitle(data.media.title || '');
      setAltText(data.media.alt_text || '');
      setCaption(data.media.caption || '');
      setDescription(data.media.description || '');
    } catch (err) {
      setError('Impossible de charger le média');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          alt_text: altText,
          caption,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de sauvegarde');
      }

      setSuccess(true);
      setTimeout(() => {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push(`/admin/sites/${siteId}/media`);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement ce média ?')) return;

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur de suppression');

      router.push(returnUrl || `/admin/sites/${siteId}/media`);
    } catch (err) {
      setError('Impossible de supprimer le média');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Média introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={returnUrl || `/admin/sites/${siteId}/media`}
            className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
          >
            ← Retour aux médias
          </Link>
          <h1 className="text-2xl font-bold text-white">Modifier le média</h1>
        </div>
        <SecondaryButton
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300"
        >
          Supprimer
        </SecondaryButton>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Média mis à jour avec succès !</SuccessMessage>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Prévisualisation */}
        <FormCard title="Prévisualisation">
          <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-700">
            <Image
              src={media.url}
              alt={altText || media.filename}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-400">
            <p><strong>Fichier :</strong> {media.filename}</p>
            <p><strong>Type :</strong> {media.mime_type}</p>
            {media.file_size && (
              <p><strong>Taille :</strong> {(media.file_size / 1024 / 1024).toFixed(2)} MB</p>
            )}
            <p><strong>URL :</strong></p>
            <input
              type="text"
              value={media.url}
              readOnly
              className="w-full px-3 py-1 bg-gray-700 border border-gray-600 text-gray-300 rounded text-xs"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </FormCard>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard title="Détails">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de l'image"
                />
              </div>

              <div>
                <Label htmlFor="alt_text">Texte alternatif (ALT)</Label>
                <Input
                  type="text"
                  id="alt_text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Description pour l'accessibilité"
                />
              </div>

              <div>
                <Label htmlFor="caption">Légende</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Légende affichée sous l'image"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description détaillée (interne)"
                  rows={3}
                />
              </div>
            </div>
          </FormCard>

          <PrimaryButton type="submit" disabled={isSaving} className="w-full">
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
