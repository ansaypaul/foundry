import { getSupabaseAdmin } from '@/lib/db/client';
import { getTermsBySiteId, getTermsByContentId } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import ContentEditForm from './ContentEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  const { data: content, error } = await supabase
    .from('content')
    .select(`
      *,
      site:sites(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !content) {
    notFound();
  }

  // Récupérer le domaine principal du site
  const { data: allDomains } = await supabase
    .from('domains')
    .select('hostname, is_primary')
    .eq('site_id', content.site_id)
    .order('is_primary', { ascending: false });

  const primaryDomain = allDomains?.find(d => d.is_primary) || allDomains?.[0];
  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${content.site_id}`;

  // Charger les catégories et tags du site + les métadonnées SEO
  const [categories, tags, contentTerms, seoMetaResult] = await Promise.all([
    getTermsBySiteId(content.site_id, 'category'),
    getTermsBySiteId(content.site_id, 'tag'),
    getTermsByContentId(content.id),
    supabase
      .from('seo_meta')
      .select('*')
      .eq('entity_type', 'content')
      .eq('entity_id', id)
      .maybeSingle(), // maybeSingle au lieu de single pour gérer le cas où ça n'existe pas
  ]);

  const seoMeta = seoMetaResult.data;

  // Debug détaillé
  console.log('🔍 Debug SEO Meta:', {
    contentId: id,
    seoMetaError: seoMetaResult.error,
    seoMetaData: seoMeta,
    hasSeoMeta: !!seoMeta,
  });

  // Merger les données SEO dans content (en excluant les champs système)
  const contentWithSeo = seoMeta 
    ? (() => {
        const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
        return {
          ...content,
          ...seoFields,
        };
      })()
    : content;

  console.log('✅ Content merged with SEO:', {
    hasContentWithSeo: !!contentWithSeo,
    seo_title: contentWithSeo.seo_title,
    seo_description: contentWithSeo.seo_description,
    allKeys: Object.keys(contentWithSeo).filter(k => k.startsWith('seo_')),
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Modifier le contenu</h2>
        <p className="text-gray-300 mt-2 text-lg">{content.title}</p>
      </div>

      <ContentEditForm 
        content={contentWithSeo} 
        categories={categories}
        tags={tags}
        contentTerms={contentTerms}
        siteUrl={siteUrl}
      />
    </div>
  );
}
