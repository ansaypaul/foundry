'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Author } from '@/lib/db/types';
import MediaUploader from '@/app/admin/components/MediaUploader';

interface AuthorFormProps {
  siteId: string;
  author?: Author;
  mode: 'create' | 'edit';
}

export default function AuthorForm({ siteId, author, mode }: AuthorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState(author?.display_name || '');
  const [email, setEmail] = useState(author?.email || '');
  const [bio, setBio] = useState(author?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(author?.avatar_url || '');
  const [avatarMediaId, setAvatarMediaId] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState(author?.website_url || '');
  const [twitterUsername, setTwitterUsername] = useState(author?.twitter_username || '');
  const [facebookUrl, setFacebookUrl] = useState(author?.facebook_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(author?.linkedin_url || '');
  const [instagramUsername, setInstagramUsername] = useState(author?.instagram_username || '');
  const [githubUsername, setGithubUsername] = useState(author?.github_username || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const url = mode === 'create'
        ? `/api/admin/sites/${siteId}/authors`
        : `/api/admin/sites/${siteId}/authors/${author?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          email: email || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
          website_url: websiteUrl || null,
          twitter_username: twitterUsername || null,
          facebook_url: facebookUrl || null,
          linkedin_url: linkedinUrl || null,
          instagram_username: instagramUsername || null,
          github_username: githubUsername || null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
      
      router.push(`/admin/sites/${siteId}/authors`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erreur */}
      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}
      
      {/* Informations de base */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Informations de base</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom affiché <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Paul Dupont"
            />
            <p className="mt-1 text-xs text-gray-400">
              Nom public de l'auteur affiché sur le site
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email public
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="auteur@exemple.com"
            />
            <p className="mt-1 text-xs text-gray-400">
              Optionnel - Email affiché publiquement (différent du compte user)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Biographie
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Expert en développement web avec plus de 10 ans d'expérience..."
            />
            <p className="mt-1 text-xs text-gray-400">
              Présentation de l'auteur affichée sur sa page et dans les articles
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Photo de profil
            </label>
            <MediaUploader
              siteId={siteId}
              selectedMediaId={avatarMediaId}
              onSelect={(id, url) => {
                setAvatarMediaId(id);
                setAvatarUrl(url || '');
              }}
              buttonText="Choisir une photo de profil"
              buttonClassName="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              mode="avatar"
            />
            <p className="mt-2 text-xs text-gray-400">
              Recommandé : 200x200px minimum, format carré
            </p>
          </div>
        </div>
      </div>
      
      {/* Liens */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Liens et réseaux sociaux</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🌐 Site web
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://monsite.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🐦 Twitter (sans @)
            </label>
            <input
              type="text"
              value={twitterUsername}
              onChange={(e) => setTwitterUsername(e.target.value.replace('@', ''))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="pauldupont"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📘 Facebook (URL)
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://facebook.com/pauldupont"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              💼 LinkedIn (URL)
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://linkedin.com/in/pauldupont"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📷 Instagram (sans @)
            </label>
            <input
              type="text"
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value.replace('@', ''))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="pauldupont"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              💻 GitHub (sans @)
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value.replace('@', ''))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="pauldupont"
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !displayName.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Sauvegarde...' : mode === 'create' ? 'Créer l\'auteur' : 'Mettre à jour'}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
