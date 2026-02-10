import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import TermEditForm from './TermEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTermPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  const { data: term, error } = await supabase
    .from('terms')
    .select(`
      *,
      site:sites(name)
    `)
    .eq('id', id)
    .single();

  if (error || !term) {
    notFound();
  }

  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'term')
    .eq('entity_id', id)
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
    .eq('site_id', term.site_id)
    .order('is_primary', { ascending: false });

  const primaryDomain = domains?.[0];
  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${term.site_id}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Modifier {term.type === 'category' ? 'la catégorie' : 'le tag'}
        </h2>
        <p className="text-gray-600 mt-2">{term.name}</p>
      </div>

      <TermEditForm 
        term={termWithSeo} 
        siteUrl={siteUrl}
        siteName={(term.site as any)?.name || 'Site'}
      />
    </div>
  );
}
