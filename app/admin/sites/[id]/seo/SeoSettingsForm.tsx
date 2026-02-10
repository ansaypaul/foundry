'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SeoSettings {
  id: string;
  site_id: string;
  // Global config
  site_name: string | null;
  site_tagline: string | null;
  site_description: string | null;
  separator: '|' | '-' | '–' | '—' | '/' | '·';
  // Title templates
  title_template_post: string;
  title_template_page: string;
  title_template_category: string;
  title_template_tag: string;
  title_template_home: string;
  // Default meta
  default_og_image: string | null;
  default_twitter_card: 'summary' | 'summary_large_image';
  // Social
  twitter_username: string | null;
  facebook_app_id: string | null;
  // Organization
  organization_name: string | null;
  organization_logo: string | null;
  // Locale
  default_locale: string;
  // Sitemap
  sitemap_posts_priority: number;
  sitemap_posts_changefreq: string;
  sitemap_pages_priority: number;
  sitemap_pages_changefreq: string;
  // Robots.txt
  custom_robots_txt: string | null;
  // Schema.org / JSON-LD
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
  
  // Global config
  const [siteName, setSiteName] = useState(initialSettings?.site_name || '');
  const [siteTagline, setSiteTagline] = useState(initialSettings?.site_tagline || '');
  const [siteDescription, setSiteDescription] = useState(initialSettings?.site_description || '');
  const [separator, setSeparator] = useState<'|' | '-' | '–' | '—' | '/' | '·'>(initialSettings?.separator || '|');
  
  // Title templates
  const [titleTemplatePost, setTitleTemplatePost] = useState(initialSettings?.title_template_post || '{{title}} | {{siteName}}');
  const [titleTemplatePage, setTitleTemplatePage] = useState(initialSettings?.title_template_page || '{{title}} | {{siteName}}');
  const [titleTemplateCategory, setTitleTemplateCategory] = useState(initialSettings?.title_template_category || '{{name}} | {{siteName}}');
  const [titleTemplateTag, setTitleTemplateTag] = useState(initialSettings?.title_template_tag || '{{name}} | {{siteName}}');
  const [titleTemplateHome, setTitleTemplateHome] = useState(initialSettings?.title_template_home || '{{siteName}} – {{tagline}}');
  
  // Default meta
  const [defaultOgImage, setDefaultOgImage] = useState(initialSettings?.default_og_image || '');
  const [defaultTwitterCard, setDefaultTwitterCard] = useState<'summary' | 'summary_large_image'>(initialSettings?.default_twitter_card || 'summary_large_image');
  
  // Social
  const [twitterUsername, setTwitterUsername] = useState(initialSettings?.twitter_username || '');
  const [facebookAppId, setFacebookAppId] = useState(initialSettings?.facebook_app_id || '');
  
  // Organization
  const [organizationName, setOrganizationName] = useState(initialSettings?.organization_name || '');
  const [organizationLogo, setOrganizationLogo] = useState(initialSettings?.organization_logo || '');
  
  // Locale
  const [defaultLocale, setDefaultLocale] = useState(initialSettings?.default_locale || 'fr_FR');
  
  // Robots.txt
  const [customRobotsTxt, setCustomRobotsTxt] = useState(initialSettings?.custom_robots_txt || '');
  const [useDefault, setUseDefault] = useState(!initialSettings?.custom_robots_txt);
  
  // Schema
  const [schemaArticleType, setSchemaArticleType] = useState(initialSettings?.schema_article_type || 'Article');
  const [schemaEnableOrganization, setSchemaEnableOrganization] = useState(initialSettings?.schema_enable_organization ?? true);
  const [schemaEnableWebsite, setSchemaEnableWebsite] = useState(initialSettings?.schema_enable_website ?? true);
  const [schemaEnableBreadcrumbs, setSchemaEnableBreadcrumbs] = useState(initialSettings?.schema_enable_breadcrumbs ?? true);

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
          // Global config
          site_name: siteName || null,
          site_tagline: siteTagline || null,
          site_description: siteDescription || null,
          separator,
          // Title templates
          title_template_post: titleTemplatePost,
          title_template_page: titleTemplatePage,
          title_template_category: titleTemplateCategory,
          title_template_tag: titleTemplateTag,
          title_template_home: titleTemplateHome,
          // Default meta
          default_og_image: defaultOgImage || null,
          default_twitter_card: defaultTwitterCard,
          // Social
          twitter_username: twitterUsername || null,
          facebook_app_id: facebookAppId || null,
          // Organization
          organization_name: organizationName || null,
          organization_logo: organizationLogo || null,
          // Locale
          default_locale: defaultLocale,
          // Robots.txt
          custom_robots_txt: useDefault ? null : customRobotsTxt,
          // Schema
          schema_article_type: schemaArticleType,
          schema_enable_organization: schemaEnableOrganization,
          schema_enable_website: schemaEnableWebsite,
          schema_enable_breadcrumbs: schemaEnableBreadcrumbs,
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
      {/* Informations globales du site */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Informations globales</h2>
          <p className="text-sm text-gray-400">
            Paramètres généraux de votre site utilisés dans les métadonnées et les templates
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du site
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Mon Site Web"
            />
            <p className="mt-1 text-xs text-gray-400">
              Utilisé dans les balises title et les métadonnées
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slogan / Tagline
            </label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Le meilleur site pour..."
            />
            <p className="mt-1 text-xs text-gray-400">
              Utilisé dans le titre de la page d'accueil
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description du site
            </label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Description générale de votre site..."
            />
            <p className="mt-1 text-xs text-gray-400">
              Description par défaut utilisée si aucune description spécifique n'est définie
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Séparateur de titre
            </label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="|">| (pipe)</option>
              <option value="-">- (tiret)</option>
              <option value="–">– (tiret demi-cadratin)</option>
              <option value="—">— (tiret cadratin)</option>
              <option value="/">/  (slash)</option>
              <option value="·">· (point médian)</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Caractère utilisé pour séparer le titre de la page du nom du site
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Locale par défaut
            </label>
            <input
              type="text"
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="fr_FR"
            />
            <p className="mt-1 text-xs text-gray-400">
              Format : fr_FR, en_US, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Templates de titre */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Templates de titre</h2>
          <p className="text-sm text-gray-400">
            Définissez comment les titres sont générés pour chaque type de page
          </p>
          <div className="mt-2 p-3 bg-blue-900/20 border border-blue-600/30 rounded text-xs text-blue-200">
            <p className="font-medium mb-1">Variables disponibles :</p>
            <p>• <code className="bg-blue-900/40 px-1 rounded">{`{{title}}`}</code> - Titre du contenu</p>
            <p>• <code className="bg-blue-900/40 px-1 rounded">{`{{siteName}}`}</code> - Nom du site</p>
            <p>• <code className="bg-blue-900/40 px-1 rounded">{`{{tagline}}`}</code> - Slogan</p>
            <p>• <code className="bg-blue-900/40 px-1 rounded">{`{{name}}`}</code> - Nom (catégorie/tag)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Articles (Posts)
            </label>
            <input
              type="text"
              value={titleTemplatePost}
              onChange={(e) => setTitleTemplatePost(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pages
            </label>
            <input
              type="text"
              value={titleTemplatePage}
              onChange={(e) => setTitleTemplatePage(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Catégories
            </label>
            <input
              type="text"
              value={titleTemplateCategory}
              onChange={(e) => setTitleTemplateCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={titleTemplateTag}
              onChange={(e) => setTitleTemplateTag(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Page d'accueil
            </label>
            <input
              type="text"
              value={titleTemplateHome}
              onChange={(e) => setTitleTemplateHome(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Organisation */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Organisation / Entreprise</h2>
          <p className="text-sm text-gray-400">
            Informations sur votre organisation utilisées dans les schémas JSON-LD
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l'organisation
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Mon Entreprise"
            />
            <p className="mt-1 text-xs text-gray-400">
              Utilisé dans le schéma Organization pour améliorer votre présence dans les résultats de recherche
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Logo de l'organisation (URL)
            </label>
            <input
              type="url"
              value={organizationLogo}
              onChange={(e) => setOrganizationLogo(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://exemple.com/logo.png"
            />
            <p className="mt-1 text-xs text-gray-400">
              URL complète du logo (recommandé : 600x60px minimum)
            </p>
          </div>
        </div>
      </div>

      {/* Réseaux sociaux */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white mb-2">Réseaux sociaux</h2>
          <p className="text-sm text-gray-400">
            Configuration des métadonnées pour les réseaux sociaux
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'utilisateur Twitter (sans @)
            </label>
            <input
              type="text"
              value={twitterUsername}
              onChange={(e) => setTwitterUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="moncompte"
            />
            <p className="mt-1 text-xs text-gray-400">
              Utilisé dans les balises Twitter Card
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Facebook App ID
            </label>
            <input
              type="text"
              value={facebookAppId}
              onChange={(e) => setFacebookAppId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="123456789"
            />
            <p className="mt-1 text-xs text-gray-400">
              Optionnel : permet de lier votre site à votre app Facebook
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type de carte Twitter par défaut
            </label>
            <select
              value={defaultTwitterCard}
              onChange={(e) => setDefaultTwitterCard(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="summary">Résumé (petite image)</option>
              <option value="summary_large_image">Résumé avec grande image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image Open Graph par défaut (URL)
            </label>
            <input
              type="url"
              value={defaultOgImage}
              onChange={(e) => setDefaultOgImage(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="https://exemple.com/og-image.jpg"
            />
            <p className="mt-1 text-xs text-gray-400">
              Image utilisée lors du partage sur les réseaux sociaux (recommandé : 1200x630px)
            </p>
          </div>
        </div>
      </div>

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

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schemaEnableBreadcrumbs}
                  onChange={(e) => setSchemaEnableBreadcrumbs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                />
                <div>
                  <span className="text-white">Breadcrumbs (Fil d'Ariane)</span>
                  <p className="text-xs text-gray-400">Fil d'Ariane structuré dans les résultats de recherche</p>
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
