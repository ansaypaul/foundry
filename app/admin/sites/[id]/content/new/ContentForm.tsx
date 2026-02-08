'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaPicker from '@/app/admin/components/MediaPicker';
import { Input, Textarea, Select, Label, HelperText, FormCard, ErrorMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  type: 'post' | 'page';
  returnUrl: string;
}

export default function ContentForm({ siteId, type, returnUrl }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les termes et les auteurs
    Promise.all([
      fetch(`/api/admin/terms?site_id=${siteId}`).then(res => res.json()),
      fetch(`/api/admin/sites/${siteId}/authors`).then(res => res.json()),
    ])
      .then(([termsData, authorsData]) => {
        setCategories(termsData.terms?.filter((t: any) => t.type === 'category') || []);
        setTags(termsData.terms?.filter((t: any) => t.type === 'tag') || []);
        setAuthors(authorsData.authors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [siteId]);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

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

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          type: type,
          title: formData.get('title'),
          slug: formData.get('slug'),
          excerpt: formData.get('excerpt'),
          content_html: formData.get('content_html'),
          status: formData.get('status'),
          featured_media_id: selectedMediaId,
          author_id: selectedAuthor || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const { content } = await response.json();

      if (type === 'post' && (selectedCategory || selectedTags.length > 0)) {
        const termIds = selectedCategory ? [selectedCategory, ...selectedTags] : selectedTags;
        
        await fetch(`/api/admin/content/${content.id}/terms`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term_ids: termIds }),
        });
      }

      router.push(returnUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <FormCard>
        <p className="text-gray-400 text-center py-8">Chargement...</p>
      </FormCard>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}

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
                placeholder="Le titre de votre contenu"
                onBlur={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement;
                  if (slugInput && !slugInput.value) {
                    slugInput.value = generateSlug(e.target.value);
                  }
                }}
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
                placeholder="<p>Votre contenu...</p>"
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
                placeholder="Un court résumé pour les aperçus..."
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
                placeholder="mon-super-article"
                className="font-mono text-sm"
              />
              <HelperText>Généré automatiquement depuis le titre</HelperText>
            </div>
          </FormCard>
        </div>

        {/* Sidebar (droite) */}
        <div className="w-80 space-y-6">
          {/* Publication */}
          <FormCard>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Publication</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select id="status" name="status" defaultValue="draft">
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </Select>
              </div>

              {/* Auteur */}
              {authors.length > 0 && (
                <div>
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
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Création...' : type === 'post' ? 'Publier l\'article' : 'Publier la page'}
              </PrimaryButton>
              <Link href={returnUrl} className="block text-center mt-3 text-sm text-gray-400 hover:text-white">
                Annuler
              </Link>
            </div>
          </FormCard>

          {/* Image à la une */}
          <FormCard>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Image à la une</h3>
            <MediaPicker
              siteId={siteId}
              selectedMediaId={selectedMediaId}
              onSelect={setSelectedMediaId}
            />
          </FormCard>

          {/* Catégorie (pour les articles) */}
          {type === 'post' && (
            <FormCard>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Catégorie</h3>
              <Select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              {categories.length === 0 && (
                <HelperText>
                  <Link href={`/admin/sites/${siteId}/terms/new?type=category`} className="text-blue-400 hover:text-blue-300">
                    + Créer une catégorie
                  </Link>
                </HelperText>
              )}
            </FormCard>
          )}

          {/* Tags (pour les articles) */}
          {type === 'post' && (
            <FormCard>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Tags</h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
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
                <Link href={`/admin/sites/${siteId}/terms/new?type=tag`} className="text-blue-400 hover:text-blue-300">
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
