import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import SiteEditForm from '../SiteEditForm';
import DomainsManager from '../DomainsManager';
import DeleteSiteButton from './DeleteSiteButton';
import ResetContentButton from './ResetContentButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const { data: domains } = await supabase
    .from('domains')
    .select('*')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-2">Configuration de {site.name}</p>
      </div>

      <div className="space-y-8">
        <SiteEditForm site={site} />
        <DomainsManager siteId={id} initialDomains={domains || []} />
        
        {/* Zone de danger */}
        <div className="bg-gray-800 rounded-lg border border-red-600/50 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Zone de danger</h3>
          <p className="text-sm text-gray-400 mb-4">
            Ces actions sont irréversibles. Soyez prudent.
          </p>
          
          {/* Reset du contenu */}
          <div className="flex items-center justify-between p-4 bg-orange-900/10 rounded-lg border border-orange-600/30 mb-4">
            <div className="flex-1 mr-4">
              <h4 className="text-white font-medium mb-1">Réinitialiser tout le contenu</h4>
              <p className="text-sm text-gray-400">
                Supprime tous les posts, pages, auteurs, catégories, menus et types de contenu. 
                Le site et les domaines seront conservés.
              </p>
            </div>
            <ResetContentButton siteId={id} siteName={site.name} />
          </div>

          {/* Suppression du site */}
          <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-lg border border-red-600/30">
            <div>
              <h4 className="text-white font-medium mb-1">Supprimer ce site</h4>
              <p className="text-sm text-gray-400">
                Supprime définitivement le site et toutes ses données (domaines, contenu, médias, menus).
              </p>
            </div>
            <DeleteSiteButton siteId={id} siteName={site.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
