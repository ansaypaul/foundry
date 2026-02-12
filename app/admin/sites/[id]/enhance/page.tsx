'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CategoriesEnhanceTab from './CategoriesEnhanceTab';
import AuthorsEnhanceTab from './AuthorsEnhanceTab';
import PagesEnhanceTab from './PagesEnhanceTab';

export default function EnhancePage() {
  const params = useParams();
  const siteId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'categories' | 'authors' | 'pages'>('categories');

  return (
    <div className="py-8">
      <Link
        href={`/admin/sites/${siteId}`}
        className="text-sm text-blue-400 hover:text-blue-300 mb-6 inline-block"
      >
        ← Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Enrichissement IA
        </h1>
        <p className="text-gray-400">
          Génération de contenu professionnel pour vos catégories, auteurs et pages
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="border-b border-gray-700 flex">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <span>Catégories</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('authors')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'authors'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✍️</span>
              <span>Auteurs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'pages'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <span>Pages</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'categories' && <CategoriesEnhanceTab siteId={siteId} />}
          {activeTab === 'authors' && <AuthorsEnhanceTab siteId={siteId} />}
          {activeTab === 'pages' && <PagesEnhanceTab siteId={siteId} />}
        </div>
      </div>

      {/* Info panel */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <div className="text-sm font-medium text-blue-300 mb-2">
              À propos de l'enrichissement IA
            </div>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Génère des descriptions SEO optimisées et du contenu visible sur le site</li>
              <li>• Mode "Remplir uniquement vide" (sûr) ou "Écraser tout" disponibles</li>
              <li>• Aperçu avant application pour validation manuelle</li>
              <li>• Tous les jobs sont loggés dans la section "Jobs IA"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
