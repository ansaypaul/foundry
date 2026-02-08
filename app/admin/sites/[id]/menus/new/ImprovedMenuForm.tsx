'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Select, Label, FormCard, ErrorMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  menu?: any;
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'custom' | 'page' | 'post' | 'category';
}

interface Content {
  id: string;
  title: string;
  slug: string;
  type: 'page' | 'post';
}

interface Term {
  id: string;
  name: string;
  slug: string;
}

export default function ImprovedMenuForm({ siteId, menu }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState(menu?.name || '');
  const [location, setLocation] = useState(menu?.location || 'header');
  const [items, setItems] = useState<MenuItem[]>(
    menu?.items ? JSON.parse(menu.items) : []
  );
  
  // États pour le sélecteur
  const [activeTab, setActiveTab] = useState<'pages' | 'posts' | 'categories' | 'custom'>('pages');
  const [pages, setPages] = useState<Content[]>([]);
  const [posts, setPosts] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Term[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // État pour lien personnalisé
  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Charger les pages, articles et catégories
  useEffect(() => {
    async function loadData() {
      try {
        // Charger les pages
        const pagesRes = await fetch(`/api/admin/content?site_id=${siteId}&type=page`);
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          setPages(Array.isArray(pagesData) ? pagesData : []);
        }

        // Charger les articles
        const postsRes = await fetch(`/api/admin/content?site_id=${siteId}&type=post`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(Array.isArray(postsData) ? postsData : []);
        }

        // Charger les catégories
        const categoriesRes = await fetch(`/api/admin/terms?site_id=${siteId}&type=category`);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          // L'API retourne { terms: [...] }
          setCategories(Array.isArray(categoriesData.terms) ? categoriesData.terms : []);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    }
    loadData();
  }, [siteId]);

  function addSelectedItems() {
    const newItems: MenuItem[] = [];
    
    if (activeTab === 'pages') {
      pages.filter(p => selectedItems.has(p.id)).forEach(page => {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          label: page.title,
          url: `/${page.slug}`,
          type: 'page',
        });
      });
    } else if (activeTab === 'posts') {
      posts.filter(p => selectedItems.has(p.id)).forEach(post => {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          label: post.title,
          url: `/${post.slug}`,
          type: 'post',
        });
      });
    } else if (activeTab === 'categories') {
      categories.filter(c => selectedItems.has(c.id)).forEach(category => {
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          label: category.name,
          url: `/${category.slug}`,
          type: 'category',
        });
      });
    }
    
    setItems([...items, ...newItems]);
    setSelectedItems(new Set());
  }

  function addCustomLink() {
    if (!customLabel || !customUrl) return;
    
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        label: customLabel,
        url: customUrl,
        type: 'custom',
      },
    ]);
    
    setCustomLabel('');
    setCustomUrl('');
  }

  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = menu ? `/api/admin/menus/${menu.id}` : '/api/admin/menus';
      const method = menu ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          name,
          location,
          items: JSON.stringify(items),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      router.push(`/admin/sites/${siteId}/menus`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-6">
      {/* Panneau gauche - Sélection d'éléments */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormCard>
          <h3 className="text-lg font-semibold text-white mb-4">Ajouter des éléments</h3>
          
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded">
            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                activeTab === 'pages'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                activeTab === 'posts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Articles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Catégories
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Lien
            </button>
          </div>

          {/* Contenu des tabs */}
          <div className="space-y-3">
            {activeTab === 'pages' && (
              <>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {pages.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Aucune page</p>
                  ) : (
                    pages.map(page => (
                      <label
                        key={page.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(page.id)}
                          onChange={() => toggleSelection(page.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-white">{page.title}</span>
                      </label>
                    ))
                  )}
                </div>
                <SecondaryButton
                  type="button"
                  onClick={addSelectedItems}
                  disabled={selectedItems.size === 0}
                  className="w-full"
                >
                  Ajouter au menu ({selectedItems.size})
                </SecondaryButton>
              </>
            )}

            {activeTab === 'posts' && (
              <>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {posts.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Aucun article</p>
                  ) : (
                    posts.map(post => (
                      <label
                        key={post.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(post.id)}
                          onChange={() => toggleSelection(post.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-white">{post.title}</span>
                      </label>
                    ))
                  )}
                </div>
                <SecondaryButton
                  type="button"
                  onClick={addSelectedItems}
                  disabled={selectedItems.size === 0}
                  className="w-full"
                >
                  Ajouter au menu ({selectedItems.size})
                </SecondaryButton>
              </>
            )}

            {activeTab === 'categories' && (
              <>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Aucune catégorie</p>
                  ) : (
                    categories.map(category => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(category.id)}
                          onChange={() => toggleSelection(category.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-white">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <SecondaryButton
                  type="button"
                  onClick={addSelectedItems}
                  disabled={selectedItems.size === 0}
                  className="w-full"
                >
                  Ajouter au menu ({selectedItems.size})
                </SecondaryButton>
              </>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="custom-label">Libellé</Label>
                  <Input
                    type="text"
                    id="custom-label"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Contact"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-url">URL</Label>
                  <Input
                    type="text"
                    id="custom-url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="/contact"
                    className="font-mono text-sm"
                  />
                </div>
                <SecondaryButton
                  type="button"
                  onClick={addCustomLink}
                  disabled={!customLabel || !customUrl}
                  className="w-full"
                >
                  Ajouter au menu
                </SecondaryButton>
              </div>
            )}
          </div>
        </FormCard>
      </div>

      {/* Panneau droit - Structure du menu */}
      <div className="flex-1 space-y-6">
        {/* Configuration du menu */}
        <FormCard>
          <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du menu *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Menu principal"
              />
            </div>

            <div>
              <Label htmlFor="location">Emplacement *</Label>
              <Select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              >
                <option value="header">En-tête</option>
                <option value="footer">Pied de page</option>
                <option value="sidebar">Barre latérale</option>
              </Select>
            </div>
          </div>
        </FormCard>

        {/* Structure du menu */}
        <FormCard>
          <h3 className="text-lg font-semibold text-white mb-4">Structure du menu</h3>
          
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Ajoutez des éléments à votre menu en utilisant le panneau de gauche
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-sm text-gray-400 font-mono">{item.url}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {item.type === 'custom' ? 'Lien personnalisé' : item.type === 'page' ? 'Page' : item.type === 'post' ? 'Article' : 'Catégorie'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-400 hover:text-red-300 ml-2"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormCard>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href={`/admin/sites/${siteId}/menus`} className="text-sm text-gray-400 hover:text-white">
            ← Annuler
          </Link>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : menu ? 'Mettre à jour' : 'Créer'}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
