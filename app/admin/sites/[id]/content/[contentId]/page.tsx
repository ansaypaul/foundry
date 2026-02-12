import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ContentEditForm from '@/app/admin/content/[id]/ContentEditForm';

interface PageProps {
  params: Promise<{ id: string; contentId: string }>;
}

export default async function EditContentPage({ params }: PageProps) {
  const { id, contentId } = await params;
  
  const site = await getSiteById(id);
  if (!site) {
    notFound();
  }

  // Charger le contenu avec les infos du site et le job AI si applicable
  const supabase = getSupabaseAdmin();
  const { data: content } = await supabase
    .from('content')
    .select(`
      *,
      site:sites(id, name)
    `)
    .eq('id', contentId)
    .single();

  // Load AI job if article was AI-generated
  let aiJob = null;
  if (content?.ai_job_id) {
    const { data } = await supabase
      .from('ai_job')
      .select('id, status, retries, finished_at, created_at')
      .eq('id', content.ai_job_id)
      .single();
    
    aiJob = data;
  }

  if (!content || content.site_id !== id) {
    notFound();
  }

  // Charger les catégories et tags du site
  const { data: categories } = await supabase
    .from('terms')
    .select('*')
    .eq('site_id', id)
    .eq('type', 'category')
    .order('name');

  const { data: tags } = await supabase
    .from('terms')
    .select('*')
    .eq('site_id', id)
    .eq('type', 'tag')
    .order('name');

  // Charger les termes associés au contenu
  const { data: contentTerms } = await supabase
    .from('term_relations')
    .select('term_id, terms(*)')
    .eq('content_id', contentId);

  const terms = contentTerms?.map(ct => ct.terms).filter(Boolean) || [];

  // Charger les métadonnées SEO
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'content')
    .eq('entity_id', contentId)
    .maybeSingle();

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

  console.log('📦 SEO loaded for content:', {
    contentId,
    hasSeoMeta: !!seoMeta,
    seo_title: seoMeta?.seo_title,
  });

  // Récupérer le domaine du site
  const { data: allDomains } = await supabase
    .from('domains')
    .select('is_primary, hostname')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });
  
  // Prendre le premier domaine (primary en premier grâce au ORDER BY)
  const primaryDomain = allDomains?.[0];

  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${id}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Modifier le contenu</h1>
        <p className="text-gray-400 mt-2">{content.title}</p>
      </div>

      {/* AI Generation Badge */}
      {aiJob && (
        <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <div className="text-blue-300 font-semibold">
                  Article généré par IA
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  Généré le {new Date(aiJob.finished_at || aiJob.created_at).toLocaleString('fr-FR')}
                  {aiJob.retries > 0 && ` · ${aiJob.retries} retry(s)`}
                </div>
              </div>
            </div>
            <Link
              href={`/admin/sites/${id}/ai-jobs/${aiJob.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Voir les détails →
            </Link>
          </div>
        </div>
      )}

      <ContentEditForm 
        content={contentWithSeo} 
        categories={categories || []} 
        tags={tags || []}
        contentTerms={terms}
        siteUrl={siteUrl}
      />
    </div>
  );
}
