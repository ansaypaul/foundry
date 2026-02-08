'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Content } from '@/lib/db/types';
import MediaPicker from '@/app/admin/components/MediaPicker';
import { Input, Textarea, Select, Label, HelperText, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  content: Content & { site: { id: string; name: string } };
  categories: any[];
  tags: any[];
  contentTerms: any[];
}

export default function ContentEditForm({ content, categories, tags, contentTerms }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(content.featured_media_id);

  useEffect(() => {
    const categoryTerm = contentTerms.find((t: any) => t.type === 'category');
    if (categoryTerm) {
      setSelectedCategory(categoryTerm.id);
    }

    const tagTerms = contentTerms.filter((t: any) => t.type === 'tag');
    setSelectedTags(tagTerms.map((t: any) => t.id));
  }, [contentTerms]);

  function toggleTag(tagId: string) {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          slug: formData.get('slug'),
          excerpt: formData.get('excerpt'),
          content_html: formData.get('content_html'),
          status: formData.get('status'),
          featured_media_id: featuredMediaId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      const termIds = selectedCategory ? [selectedCategory, ...selectedTags] : selectedTags;
      
      const termsResponse = await fetch(`/api/admin/content/${content.id}/terms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term_ids: termIds }),
      });

      if (!termsResponse.ok) {
        throw new Error('Erreur lors de la mise à jour des taxonomies');
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsDeleting(false);
    }
  }

  const returnUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('returnTo') || '/admin/content'
    : '/admin/content';

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Contenu mis à jour avec succès !</SuccessMessage>}

      {/* Layout 2 colonnes */}
      <div className="flex gap-6">
        {/* Colonne principale (gauche) */}
        <div className="flex-1 space-y-6">
          <FormCard>
            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={content.title}
              />
            </div>
          </FormCard>

          <FormCard>
            {/* Contenu HTML */}
            <div>
              <Label htmlFor="content_html">Contenu</Label>
              <Textarea
                id="content_html"
                name="content_html"
                rows={20}
                defaultValue={content.content_html || ''}
                className="font-mono text-sm"
              />
              <HelperText>HTML autorisé : p, h2, h3, strong, em, ul, li</HelperText>
            </div>
          </FormCard>

          <FormCard>
            {/* Extrait */}
            <div>
              <Label htmlFor="excerpt">Extrait</Label>
              <Textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                defaultValue={content.excerpt || ''}
              />
            </div>
          </FormCard>

          <FormCard>
            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                type="text"
                id="slug"
                name="slug"
                required
                defaultValue={content.slug}
                className="font-mono text-sm"
              />
            </div>

            {/* Métadonnées */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400">Créé le</dt>
                  <dd className="text-white mt-1">
                    {new Date(content.created_at).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Modifié le</dt>
                  <dd className="text-white mt-1">
                    {new Date(content.updated_at).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
                {content.published_at && (
                  <div>
                    <dt className="text-gray-400">Publié le</dt>
                    <dd className="text-white mt-1">
                      {new Date(content.published_at).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </FormCard>
        </div>

        {/* Sidebar (droite) */}
        <div className="w-80 space-y-6">
          {/* Publication */}
          <FormCard>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Publication</h3>
            
            <div className="p-3 bg-gray-700/50 rounded mb-4">
              <p className="text-xs text-gray-400">Site</p>
              <p className="text-white font-medium">{content.site.name}</p>
            </div>

            <div className="p-3 bg-gray-700/50 rounded mb-4">
              <p className="text-xs text-gray-400">Type</p>
              <p className="text-white font-medium">{content.type === 'post' ? 'Article' : 'Page'}</p>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select id="status" name="status" defaultValue={content.status}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </Select>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700 space-y-2">
              <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full text-red-400 hover:text-red-300"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </SecondaryButton>
              <Link href={returnUrl} className="block text-center text-sm text-gray-400 hover:text-white">
                Retour
              </Link>
            </div>
          </FormCard>

          {/* Image à la une */}
          <FormCard>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Image à la une</h3>
            <MediaPicker
              siteId={content.site.id}
              selectedMediaId={featuredMediaId}
              onSelect={(mediaId) => setFeaturedMediaId(mediaId)}
            />
          </FormCard>

          {/* Catégorie (pour les articles) */}
          {content.type === 'post' && (
            <FormCard>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Catégorie</h3>
              <Select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              {categories.length === 0 && (
                <HelperText>
                  <Link href="/admin/terms/new?type=category" className="text-blue-400 hover:text-blue-300">
                    + Créer une catégorie
                  </Link>
                </HelperText>
              )}
            </FormCard>
          )}

          {/* Tags (pour les articles) */}
          {content.type === 'post' && (
            <FormCard>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Tags</h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: any) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-2">Aucun tag</p>
              )}
              <HelperText>
                <Link href="/admin/terms/new?type=tag" className="text-blue-400 hover:text-blue-300">
                  + Créer un tag
                </Link>
              </HelperText>
            </FormCard>
          )}
        </div>
      </div>
    </form>
  );
}
