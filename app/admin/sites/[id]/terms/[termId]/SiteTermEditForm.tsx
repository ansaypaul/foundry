'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Term } from '@/lib/db/types';
import Link from 'next/link';
import { Input, Textarea, Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';
import { SeoBox } from '@/app/admin/components/SeoBox';
import RichTextEditor from '@/app/admin/components/RichTextEditor';

interface Props {
  term: Term;
  siteId: string;
  siteUrl?: string;
  siteName?: string;
}

export default function SiteTermEditForm({ term, siteId, siteUrl, siteName }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [name, setName] = useState(term.name);
  const [slug, setSlug] = useState(term.slug);
  const [description, setDescription] = useState(term.description || '');
  
  const [seoData, setSeoData] = useState({
    ...term,
    title: term.name, // Pour que SeoBox fonctionne
    excerpt: term.description,
  });

  function handleSeoUpdate(field: string, value: any) {
    setSeoData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch(`/api/admin/terms/${term.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          // Champs SEO
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_canonical: seoData.seo_canonical,
          seo_robots_index: seoData.seo_robots_index,
          seo_robots_follow: seoData.seo_robots_follow,
          seo_og_title: seoData.seo_og_title,
          seo_og_description: seoData.seo_og_description,
          seo_og_image: seoData.seo_og_image,
          seo_twitter_title: seoData.seo_twitter_title,
          seo_twitter_description: seoData.seo_twitter_description,
          seo_twitter_image: seoData.seo_twitter_image,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce terme ?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/terms/${term.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      router.push(`/admin/sites/${siteId}/terms`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Terme mis à jour avec succès !</SuccessMessage>}

      {/* Champs de base */}
      <FormCard>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Nom *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug (URL) *</Label>
            <Input
              type="text"
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <p className="text-xs text-gray-400 mb-2">
              Description visible sur la page de la catégorie. Supporte le HTML enrichi.
            </p>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Décrivez cette catégorie..."
              siteId={siteId}
            />
          </div>
        </div>
      </FormCard>

      {/* SEO Box séparé */}
      <SeoBox
        content={seoData}
        onUpdate={handleSeoUpdate}
        siteUrl={siteUrl}
        siteName={siteName}
        showAnalysis={false}
        showPreview={true}
        showAdvanced={true}
      />

      {/* Métadonnées */}
      <FormCard>
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-400">Type</dt>
              <dd className="text-white mt-1 capitalize">{term.type}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Créé le</dt>
              <dd className="text-white mt-1">
                {new Date(term.created_at).toLocaleDateString('fr-FR')}
              </dd>
            </div>
          </dl>
        </div>
      </FormCard>

      {/* Actions */}
      <FormCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/admin/sites/${siteId}/terms`} className="text-sm text-gray-400 hover:text-white">
              ← Retour
            </Link>
            <SecondaryButton
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:text-red-300"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </SecondaryButton>
          </div>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </PrimaryButton>
        </div>
      </FormCard>
    </form>
  );
}
