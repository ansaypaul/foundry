import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import SiteEditForm from '../SiteEditForm';
import DomainsManager from '../DomainsManager';

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
      </div>
    </div>
  );
}
