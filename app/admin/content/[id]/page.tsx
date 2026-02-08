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

  // Charger les catégories et tags du site
  const [categories, tags, contentTerms] = await Promise.all([
    getTermsBySiteId(content.site_id, 'category'),
    getTermsBySiteId(content.site_id, 'tag'),
    getTermsByContentId(content.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Modifier le contenu</h2>
        <p className="text-gray-300 mt-2 text-lg">{content.title}</p>
      </div>

      <ContentEditForm 
        content={content} 
        categories={categories}
        tags={tags}
        contentTerms={contentTerms}
      />
    </div>
  );
}
