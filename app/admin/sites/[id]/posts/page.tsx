import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostsManager from './PostsManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SitePostsPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  
  // Récupérer le domaine principal du site
  const { data: allDomains } = await supabase
    .from('domains')
    .select('hostname, is_primary')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });

  const primaryDomain = allDomains?.find(d => d.is_primary) || allDomains?.[0];
  const siteUrl = primaryDomain?.hostname 
    ? `https://${primaryDomain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${id}`;
  
  // Charger les posts avec leurs catégories
  const [postsResult, categoriesResult] = await Promise.all([
    supabase
      .from('content')
      .select(`
        *,
        term_relations (
          term_id,
          terms:terms (
            id,
            name,
            slug,
            type
          )
        )
      `)
      .eq('site_id', id)
      .eq('type', 'post')
      .order('created_at', { ascending: false }),
    supabase
      .from('terms')
      .select('*')
      .eq('site_id', id)
      .eq('type', 'category')
      .order('name'),
  ]);

  // Transformer les données pour inclure les catégories
  const postsWithCategories = (postsResult.data || []).map(post => ({
    ...post,
    categories: (post.term_relations || [])
      .map((tr: any) => tr.terms)
      .filter((t: any) => t && t.type === 'category')
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Articles</h1>
          <p className="text-gray-400 mt-2">Gérer les articles de {site.name}</p>
        </div>
        <Link
          href={`/admin/sites/${id}/content/new?type=post`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouvel article
        </Link>
      </div>

      <PostsManager 
        siteId={id}
        siteName={site.name}
        siteUrl={siteUrl}
        initialPosts={postsWithCategories}
        categories={categoriesResult.data || []}
      />
    </div>
  );
}
