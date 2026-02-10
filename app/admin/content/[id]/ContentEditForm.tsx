'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Content } from '@/lib/db/types';
import MediaPicker from '@/app/admin/components/MediaPicker';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { SeoBox } from '@/app/admin/components/SeoBox';
import { Input, Textarea, Select, Label, HelperText, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  content: Content & { site: { id: string; name: string } };
  categories: any[];
  tags: any[];
  contentTerms: any[];
  siteUrl: string;
}

export default function ContentEditForm({ content, categories, tags, contentTerms, siteUrl }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(content.featured_media_id);
  const [selectedAuthor, setSelectedAuthor] = useState<string>(content.author_id || '');
  const [authors, setAuthors] = useState<any[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  
  // États pour les champs du formulaire
  const [title, setTitle] = useState(content.title);
  const [slug, setSlug] = useState(content.slug);
  const [excerpt, setExcerpt] = useState(content.excerpt || '');
  const [contentHtml, setContentHtml] = useState(content.content_html || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>(content.status);
  const [publishedAt, setPublishedAt] = useState(
    content.published_at ? new Date(content.published_at).toISOString().slice(0, 16) : ''
  );
  
  // État pour les données SEO
  const [seoData, setSeoData] = useState({
    ...content,
    title,
    excerpt,
    slug,
    content_html: contentHtml,
  });

  useEffect(() => {
    const categoryTerm = contentTerms.find((t: any) => t.type === 'category');
    if (categoryTerm) {
      setSelectedCategory(categoryTerm.id);
    }

    const tagTerms = contentTerms.filter((t: any) => t.type === 'tag');
    setSelectedTags(tagTerms.map((t: any) => t.id));
  }, [contentTerms]);

  useEffect(() => {
    // Charger les auteurs du site
    fetch(`/api/admin/sites/${content.site.id}/authors`)
      .then(res => res.json())
      .then(data => {
        setAuthors(data.authors || []);
        setLoadingAuthors(false);
      })
      .catch(() => setLoadingAuthors(false));
  }, [content.site.id]);

  function toggleTag(tagId: string) {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }
  
  function handleSeoUpdate(field: string, value: any) {
    setSeoData(prev => ({ ...prev, [field]: value }));
  }
  
  // Sync les champs principaux avec seoData pour les previews
  useEffect(() => {
    setSeoData(prev => ({ ...prev, title, excerpt, slug, content_html: contentHtml }));
  }, [title, excerpt, slug, contentHtml]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Calculer le statut automatiquement selon la date
      let finalStatus: 'draft' | 'published' | 'scheduled' = status;
      if (publishedAt && status !== 'draft') {
        const pubDate = new Date(publishedAt);
        const now = new Date();
        finalStatus = pubDate > now ? 'scheduled' : 'published';
      }

      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content_html: contentHtml,
          status: finalStatus,
          published_at: publishedAt || null,
          featured_media_id: featuredMediaId,
          author_id: selectedAuthor || null,
          // Champs SEO
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_focus_keyword: seoData.seo_focus_keyword,
          seo_canonical: seoData.seo_canonical,
          seo_robots_index: seoData.seo_robots_index,
          seo_robots_follow: seoData.seo_robots_follow,
          seo_og_title: seoData.seo_og_title,
          seo_og_description: seoData.seo_og_description,
          seo_og_image: seoData.seo_og_image,
          seo_twitter_title: seoData.seo_twitter_title,
          seo_twitter_description: seoData.seo_twitter_description,
          seo_twitter_image: seoData.seo_twitter_image,
          seo_twitter_card: seoData.seo_twitter_card,
          seo_breadcrumb_title: (seoData as any).seo_breadcrumb_title,
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              {/* Permalien */}
              {slug && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-400">Permalien : </span>
                  <Link 
                    href={`${siteUrl}/${slug}?preview=1`}
                    target="_blank"
                    className="text-blue-500 hover:text-blue-600 underline break-all"
                  >
                    {siteUrl}/{slug}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const newSlug = window.prompt('Modifier le slug (uniquement la partie finale):', slug);
                      if (newSlug) setSlug(newSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }}
                    className="ml-2 text-blue-500 hover:text-blue-600 whitespace-nowrap"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>
          </FormCard>

          <FormCard>
            {/* Contenu HTML */}
            <div>
              <Label>Contenu</Label>
              <RichTextEditor
                content={contentHtml}
                onChange={setContentHtml}
                placeholder="Commencez à écrire votre contenu..."
                siteId={content.site.id}
              />
              <HelperText>Utilisez la barre d'outils pour formater votre contenu</HelperText>
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
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
          </FormCard>
          
          {/* SEO Box */}
          <SeoBox
            content={seoData}
            onUpdate={handleSeoUpdate}
            siteUrl="https://example.com"
            siteName={content.site.name}
            showAnalysis={true}
            showPreview={true}
            showAdvanced={true}
          />

          <FormCard>
            {/* Métadonnées */}
            <div>
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
              <Select 
                id="status" 
                name="status" 
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'scheduled')}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                {status === 'scheduled' && <option value="scheduled">Programmé</option>}
              </Select>
            </div>

            {/* Date de publication */}
            {status !== 'draft' && (
              <div className="mt-4">
                <Label htmlFor="published-at">Date de publication</Label>
                <Input
                  type="datetime-local"
                  id="published-at"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
                <HelperText>
                  {publishedAt && new Date(publishedAt) > new Date() 
                    ? '📅 Publication programmée le ' + new Date(publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : status === 'published' 
                      ? '✅ Publié le ' + (publishedAt ? new Date(publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'maintenant')
                      : 'Choisir une date de publication'}
                </HelperText>
              </div>
            )}

            {/* Auteur */}
            {!loadingAuthors && authors.length > 0 && (
              <div className="mt-4">
                <Label htmlFor="author">Auteur</Label>
                <Select
                  id="author"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                >
                  <option value="">Aucun auteur</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

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
