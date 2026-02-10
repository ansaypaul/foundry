import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import SiteTermEditForm from './SiteTermEditForm';

interface PageProps {
  params: Promise<{ id: string; termId: string }>;
}

export default async function EditTermPage({ params }: PageProps) {
  const { id, termId } = await params;
  
  const site = await getSiteById(id);
  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const { data: term } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single();

  if (!term || term.site_id !== id) {
    notFound();
  }

  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'term')
    .eq('entity_id', termId)
    .maybeSingle();

  // Merger les données SEO (en excluant les champs système)
  const termWithSeo = seoMeta 
    ? (() => {
        const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
        return {
          ...term,
          ...seoFields,
        };
      })()
    : term;

  // Récupérer le domaine du site
  const { data: domains } = await supabase
    .from('domains')
    .select('hostname, is_primary')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });

  const primaryDomain = domains?.[0];
  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${id}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Modifier la taxonomie</h1>
        <p className="text-gray-400 mt-2">{term.name}</p>
      </div>

      <SiteTermEditForm 
        term={termWithSeo} 
        siteId={id}
        siteUrl={siteUrl}
        siteName={site.name}
      />
    </div>
  );
}
