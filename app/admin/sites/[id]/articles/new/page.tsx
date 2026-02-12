'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Label, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';
import Link from 'next/link';

interface ContentType {
  key: string;
  label: string;
  rules_json: {
    length: { min_words: number; target_words: number };
    constraints: {
      no_emojis: boolean;
      no_em_dash: boolean;
      max_lists: number;
      min_list_items: number;
      min_paragraphs_per_h2: number;
    };
  };
}

interface Author {
  id: string;
  display_name: string;
  role_key: string;
}

interface Category {
  id: string;
  name: string;
}

export default function NewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string>('');
  
  useEffect(() => {
    params.then(p => setSiteId(p.id));
  }, [params]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ code: string; message: string }>>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentTypeKey, setContentTypeKey] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const selectedContentType = contentTypes.find(ct => ct.key === contentTypeKey);
  const wordCount = contentHtml.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load content types
      const ctResponse = await fetch(`/api/admin/sites/${siteId}/setup/content-types`);
      if (ctResponse.ok) {
        const ctData = await ctResponse.json();
        setContentTypes(ctData.plan || []);
        if (ctData.plan?.length > 0) {
          setContentTypeKey(ctData.plan[0].key);
        }
      }

      // Load authors
      const authorsResponse = await fetch(`/api/admin/sites/${siteId}/authors`);
      if (authorsResponse.ok) {
        const authorsData = await authorsResponse.json();
        setAuthors(authorsData.authors || []);
        if (authorsData.authors?.length > 0) {
          setAuthorId(authorsData.authors[0].id);
        }
      }

      // Load categories
      const categoriesResponse = await fetch(`/api/admin/sites/${siteId}/terms/categories`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(status: 'draft' | 'published') {
    try {
      setSubmitting(true);
      setError(null);
      setValidationErrors([]);
      setSuccess(null);

      const response = await fetch(`/api/admin/sites/${siteId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contentHtml,
          contentTypeKey,
          authorId,
          categoryId: categoryId || undefined,
          status,
          excerpt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.validationErrors) {
          setValidationErrors(data.validationErrors);
          setError('L\'article ne respecte pas les règles du type de contenu');
        } else {
          setError(data.error || 'Erreur lors de la création');
        }
        return;
      }

      setSuccess(data.message);
      
      // Redirect to article list
      setTimeout(() => {
        router.push(`/admin/sites/${siteId}/posts`);
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !siteId) {
    return (
      <div className="max-w-5xl mx-auto">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/admin/sites/${siteId}/posts`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour aux articles
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Nouvel article</h1>
        <p className="text-gray-400 mt-2">Création manuelle d'un article</p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <h3 className="text-red-400 font-semibold mb-2">Erreurs de validation :</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
            {validationErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'article"
            required
          />
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="contentType">Type de contenu *</Label>
            <Select
              id="contentType"
              value={contentTypeKey}
              onChange={(e) => setContentTypeKey(e.target.value)}
              required
            >
              {contentTypes.map(ct => (
                <option key={ct.key} value={ct.key}>
                  {ct.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="author">Auteur *</Label>
            <Select
              id="author"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              required
            >
              {authors.map(a => (
                <option key={a.id} value={a.id}>
                  {a.display_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Aucune</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <Label htmlFor="excerpt">Extrait</Label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Court résumé de l'article"
          />
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">Contenu HTML *</Label>
          <textarea
            id="content"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            rows={20}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            placeholder="<p>Contenu de l'article...</p>"
            required
          />
          <div className="mt-2 text-sm text-gray-400">
            Nombre de mots : <span className="text-white font-medium">{wordCount}</span>
          </div>
        </div>

        {/* Content Type Rules */}
        {selectedContentType && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Règles du type de contenu</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Mots minimum</div>
                <div className="text-white font-medium">
                  {selectedContentType.rules_json.length.min_words}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Mots cible</div>
                <div className="text-white font-medium">
                  {selectedContentType.rules_json.length.target_words}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Listes max</div>
                <div className="text-white font-medium">
                  {selectedContentType.rules_json.constraints.max_lists}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Items min par liste</div>
                <div className="text-white font-medium">
                  {selectedContentType.rules_json.constraints.min_list_items}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Paragraphes min par H2</div>
                <div className="text-white font-medium">
                  {selectedContentType.rules_json.constraints.min_paragraphs_per_h2}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Contraintes</div>
                <div className="text-white text-xs">
                  {selectedContentType.rules_json.constraints.no_emojis && '❌ Emojis'}
                  {selectedContentType.rules_json.constraints.no_em_dash && ' • ❌ Tirets longs'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <PrimaryButton
            onClick={() => handleSubmit('published')}
            disabled={submitting || !title || !contentHtml || !contentTypeKey || !authorId}
          >
            {submitting ? 'Publication...' : 'Publier'}
          </PrimaryButton>
          <SecondaryButton
            onClick={() => handleSubmit('draft')}
            disabled={submitting || !title || !contentHtml || !contentTypeKey || !authorId}
          >
            Enregistrer comme brouillon
          </SecondaryButton>
          <Link
            href={`/admin/sites/${siteId}/posts`}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
