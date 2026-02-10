'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input, Select, Label, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  author_id: string | null;
  categories?: any[];
}

interface Props {
  siteId: string;
  siteName: string;
  siteUrl: string;
  initialPosts: Post[];
  categories: any[];
}

export default function PostsManager({ siteId, siteName, siteUrl, initialPosts, categories }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState(initialPosts);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Appliquer les filtres
  useEffect(() => {
    let result = [...posts];

    // Recherche
    if (searchQuery) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtre statut
    if (statusFilter !== 'all') {
      result = result.filter(post => post.status === statusFilter);
    }

    // Filtre catégorie
    if (categoryFilter !== 'all') {
      result = result.filter(post => 
        post.categories && post.categories.some(cat => cat.id === categoryFilter)
      );
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

    setFilteredPosts(result);
  }, [posts, searchQuery, statusFilter, categoryFilter, sortBy, sortOrder]);

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Publiés</div>
          <div className="text-2xl font-bold text-green-400">{stats.published}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Brouillons</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.draft}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="md:col-span-2">
            <Label htmlFor="search">Rechercher</Label>
            <Input
              type="text"
              id="search"
              placeholder="Titre, contenu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtre statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </Select>
          </div>

          {/* Filtre catégorie */}
          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Tri */}
          <div>
            <Label htmlFor="sort">Trier par</Label>
            <Select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as 'date' | 'title');
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <option value="date-desc">Date (récent)</option>
              <option value="date-asc">Date (ancien)</option>
              <option value="title-asc">Titre (A-Z)</option>
              <option value="title-desc">Titre (Z-A)</option>
            </Select>
          </div>
        </div>

        {/* Boutons actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {filteredPosts.length} article{filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}
          </div>
          <SecondaryButton
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCategoryFilter('all');
              setSortBy('date');
              setSortOrder('desc');
            }}
          >
            Réinitialiser
          </SecondaryButton>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Aucun article ne correspond à vos filtres'
                : 'Aucun article'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href={`/admin/sites/${siteId}/content/new?type=post`}
                className="text-blue-400 hover:text-blue-300"
              >
                Créer votre premier article →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Catégories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{post.title}</div>
                        {post.excerpt && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {post.excerpt}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.categories && post.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.categories.map((cat: any) => (
                            <span
                              key={cat.id}
                              className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(post.published_at || post.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`${siteUrl}/${post.slug}${post.status !== 'published' ? '?preview=1' : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Voir
                        </a>
                        <Link
                          href={`/admin/sites/${siteId}/content/${post.id}`}
                          className="text-gray-300 hover:text-white"
                        >
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
