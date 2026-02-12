import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AuthorsSetup from './AuthorsSetup';
import TaxonomySetup from './TaxonomySetup';
import MandatoryPagesSetup from './MandatoryPagesSetup';
import ContentTypesSetup from './ContentTypesSetup';
import SeoBootstrapSetup from './SeoBootstrapSetup';
import AiBlueprintGenerator from './AiBlueprintGenerator';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteSetupPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          href={`/admin/sites/${id}`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Configuration du site</h1>
        <p className="text-gray-400 mt-2">
          Configurez la structure de base de votre site : {site.name}
        </p>
      </div>

      {/* AI Blueprint Generator */}
      <AiBlueprintGenerator siteId={id} />

      {/* Site Configuration Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration actuelle</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Langue</div>
            <div className="text-white font-medium mt-1">{site.language.toUpperCase()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Pays</div>
            <div className="text-white font-medium mt-1">{site.country}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Type de site</div>
            <div className="text-white font-medium mt-1">
              {site.site_type === 'niche_passion' && 'Niche / Passion'}
              {site.site_type === 'news_media' && 'Actualités / Média'}
              {site.site_type === 'gaming_popculture' && 'Gaming / Pop Culture'}
              {site.site_type === 'affiliate_guides' && 'Guides / Affiliation'}
              {site.site_type === 'lifestyle' && 'Lifestyle'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Automatisation</div>
            <div className="text-white font-medium mt-1">
              {site.automation_level === 'manual' && 'Manuel'}
              {site.automation_level === 'ai_assisted' && 'Assisté par IA'}
              {site.automation_level === 'ai_auto' && 'Automatique (IA)'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Ambition</div>
            <div className="text-white font-medium mt-1">
              {site.ambition_level === 'auto' && 'Auto'}
              {site.ambition_level === 'starter' && 'Starter'}
              {site.ambition_level === 'growth' && 'Growth'}
              {site.ambition_level === 'factory' && 'Factory'}
            </div>
          </div>
        </div>
        {site.description && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Description</div>
            <div className="text-white">{site.description}</div>
          </div>
        )}
      </div>

      {/* Authors Setup */}
      <AuthorsSetup siteId={id} />

      {/* Taxonomy Setup */}
      <TaxonomySetup siteId={id} />

      {/* Mandatory Pages Setup */}
      <MandatoryPagesSetup siteId={id} />

      {/* Content Types Setup */}
      <ContentTypesSetup siteId={id} />

      {/* SEO Bootstrap Setup */}
      <SeoBootstrapSetup siteId={id} />

      {/* Manual Setup Options */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Configuration manuelle (disponible maintenant)
        </h3>
        <p className="text-gray-400 mb-4">
          En attendant l'AI Bootstrap, vous pouvez configurer votre site manuellement :
        </p>
        <div className="space-y-3">
          <Link
            href={`/admin/sites/${id}/terms?type=category`}
            className="block p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <div className="font-medium text-white">Créer des catégories</div>
                <div className="text-sm text-gray-400">Organisez votre contenu par thématiques</div>
              </div>
            </div>
          </Link>
          <Link
            href={`/admin/sites/${id}/authors/new`}
            className="block p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✍️</span>
              <div>
                <div className="font-medium text-white">Ajouter des auteurs</div>
                <div className="text-sm text-gray-400">Créez les profils des rédacteurs</div>
              </div>
            </div>
          </Link>
          <Link
            href={`/admin/sites/${id}/content/new?type=page`}
            className="block p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium text-white">Créer des pages essentielles</div>
                <div className="text-sm text-gray-400">À propos, Contact, Mentions légales...</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
