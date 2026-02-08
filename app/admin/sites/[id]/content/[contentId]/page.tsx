import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
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

  // Charger le contenu avec les infos du site
  const supabase = getSupabaseAdmin();
  const { data: content } = await supabase
    .from('content')
    .select(`
      *,
      site:sites(id, name)
    `)
    .eq('id', contentId)
    .single();

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Modifier le contenu</h1>
        <p className="text-gray-400 mt-2">{content.title}</p>
      </div>

      <ContentEditForm 
        content={content} 
        categories={categories || []} 
        tags={tags || []}
        contentTerms={terms}
      />
    </div>
  );
}
