import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import ContentForm from './ContentForm';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function NewSiteContentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  
  const site = await getSiteById(id);
  if (!site) {
    notFound();
  }

  // Récupérer le domaine du site
  const supabase = getSupabaseAdmin();
  
  const { data: allDomains, error: domainsError } = await supabase
    .from('domains')
    .select('domain, is_primary, hostname')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });
  
  // Prendre le premier domaine (primary en premier grâce au ORDER BY)
  const primaryDomain = allDomains?.[0];
  
  console.log('🔍 Domains for site:', id, allDomains, 'primary:', primaryDomain);

  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${id}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Créer {type === 'page' ? 'une page' : 'un article'}</h1>
        <p className="text-gray-400 mt-2">Nouveau contenu pour {site.name}</p>
      </div>

      <ContentForm 
        siteId={id} 
        type={(type as 'post' | 'page') || 'post'}
        returnUrl={`/admin/sites/${id}/content`}
        siteUrl={siteUrl}
      />
    </div>
  );
}

