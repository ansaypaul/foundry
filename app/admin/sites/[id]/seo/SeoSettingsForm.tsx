'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SeoSettings {
  id: string;
  site_id: string;
  custom_robots_txt: string | null;
  sitemap_posts_priority: number;
  sitemap_posts_changefreq: string;
  sitemap_pages_priority: number;
  sitemap_pages_changefreq: string;
  schema_article_type: 'Article' | 'NewsArticle' | 'BlogPosting' | 'TechArticle' | 'ScholarlyArticle';
  schema_enable_organization: boolean;
  schema_enable_website: boolean;
  schema_enable_breadcrumbs: boolean;
  [key: string]: any;
}

interface Props {
  siteId: string;
  initialSettings: SeoSettings | null;
}

export default function SeoSettingsForm({ siteId, initialSettings }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [customRobotsTxt, setCustomRobotsTxt] = useState(initialSettings?.custom_robots_txt || '');
  const [useDefault, setUseDefault] = useState(!initialSettings?.custom_robots_txt);
  const [schemaArticleType, setSchemaArticleType] = useState(initialSettings?.schema_article_type || 'Article');
  const [schemaEnableOrganization, setSchemaEnableOrganization] = useState(initialSettings?.schema_enable_organization ?? true);
  const [schemaEnableWebsite, setSchemaEnableWebsite] = useState(initialSettings?.schema_enable_website ?? true);

  const defaultRobotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://votredomaine.com/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

Crawl-delay: 1`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/sites/${siteId}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_robots_txt: useDefault ? null : customRobotsTxt,
          schema_article_type: schemaArticleType,
          schema_enable_organization: schemaEnableOrganization,
          schema_enable_website: schemaEnableWebsite,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setMessage({ type: 'success', text: 'Paramètres SEO sauvegardés avec succès !' });
      router.refresh();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Robots.txt */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Robots.txt</h2>
          <p className="text-sm text-gray-400">
            Contrôle l'accès des robots d'indexation à votre site
          </p>
        </div>

        <div className="space-y-4">
          {/* Toggle entre défaut et personnalisé */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={useDefault}
                onChange={() => setUseDefault(true)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-2"
              />
              <span className="text-white">Utiliser le robots.txt par défaut</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={!useDefault}
                onChange={() => setUseDefault(false)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-2"
              />
              <span className="text-white">Personnaliser</span>
            </label>
          </div>

          {/* Aperçu du défaut */}
          {useDefault && (
            <div className="bg-gray-900 rounded p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Aperçu du robots.txt par défaut :</p>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {defaultRobotsTxt}
              </pre>
            </div>
          )}

          {/* Éditeur personnalisé */}
          {!useDefault && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contenu personnalisé du robots.txt
              </label>
              <textarea
                value={customRobotsTxt}
                onChange={(e) => setCustomRobotsTxt(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder={defaultRobotsTxt}
              />
              <p className="mt-2 text-xs text-gray-400">
                Conseil : Incluez toujours le lien vers votre sitemap
              </p>
            </div>
          )}

          {/* Lien de prévisualisation */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-2">
              📄 Prévisualisez votre robots.txt
            </p>
            <a
              href={`/robots.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Ouvrir /robots.txt dans un nouvel onglet
            </a>
          </div>
        </div>
      </div>

      {/* Schema.org / JSON-LD Settings */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Schémas JSON-LD (Schema.org)</h2>
          <p className="text-sm text-gray-400">
            Configuration des données structurées pour améliorer le référencement
          </p>
        </div>

        <div className="space-y-6">
          {/* Type de schéma pour les articles */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type de schéma pour les articles
            </label>
            <select
              value={schemaArticleType}
              onChange={(e) => setSchemaArticleType(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="Article">Article (général)</option>
              <option value="NewsArticle">NewsArticle (actualités)</option>
              <option value="BlogPosting">BlogPosting (blog)</option>
              <option value="TechArticle">TechArticle (technique/documentation)</option>
              <option value="ScholarlyArticle">ScholarlyArticle (académique/recherche)</option>
            </select>
            <p className="mt-2 text-xs text-gray-400">
              {schemaArticleType === 'Article' && '📰 Type générique pour tous types d\'articles'}
              {schemaArticleType === 'NewsArticle' && '📰 Optimisé pour les sites d\'actualités et Google News'}
              {schemaArticleType === 'BlogPosting' && '✍️ Optimisé pour les blogs et articles d\'opinion'}
              {schemaArticleType === 'TechArticle' && '💻 Optimisé pour les tutoriels et documentation technique'}
              {schemaArticleType === 'ScholarlyArticle' && '🎓 Optimisé pour les articles académiques et scientifiques'}
            </p>
          </div>

          {/* Schémas activés */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Schémas activés</p>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schemaEnableWebsite}
                  onChange={(e) => setSchemaEnableWebsite(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                />
                <div>
                  <span className="text-white">WebSite</span>
                  <p className="text-xs text-gray-400">Informations générales sur le site</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schemaEnableOrganization}
                  onChange={(e) => setSchemaEnableOrganization(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                />
                <div>
                  <span className="text-white">Organization</span>
                  <p className="text-xs text-gray-400">Informations sur l'organisation/entreprise</p>
                </div>
              </label>
            </div>
          </div>

          {/* Info sur les schémas */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-2">
              ℹ️ À propos des schémas JSON-LD
            </p>
            <p className="text-xs text-blue-200/70">
              Les schémas JSON-LD aident les moteurs de recherche à mieux comprendre votre contenu. 
              Ils peuvent améliorer l'affichage dans les résultats de recherche (rich snippets) et 
              augmenter votre visibilité sur Google, Bing et autres moteurs.
            </p>
          </div>
        </div>
      </div>

      {/* Message de succès/erreur */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/20 border border-green-600/30 text-green-400'
              : 'bg-red-900/20 border border-red-600/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Boutons */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}
