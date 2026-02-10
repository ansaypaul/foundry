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
        siteUrl={siteUrl}
      />
    </div>
  );
}
