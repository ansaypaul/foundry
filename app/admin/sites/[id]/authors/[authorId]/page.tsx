import { getSiteById } from '@/lib/db/queries';
import { getAuthorById } from '@/lib/db/authors-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import AuthorForm from '../AuthorForm';

interface PageProps {
  params: Promise<{ id: string; authorId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditAuthorPage({ params }: PageProps) {
  const { id: siteId, authorId } = await params;
  
  const [site, author] = await Promise.all([
    getSiteById(siteId),
    getAuthorById(authorId),
  ]);
  
  if (!site || !author) {
    notFound();
  }
  
  // Vérifier que l'auteur appartient bien au site
  if (author.site_id !== siteId) {
    notFound();
  }

  // Charger les métadonnées SEO de l'auteur
  const supabase = getSupabaseAdmin();
  const { data: seoMeta } = await supabase
    .from('seo_meta')
    .select('*')
    .eq('entity_type', 'author')
    .eq('entity_id', authorId)
    .maybeSingle();

  // Merger les données SEO dans author
  const authorWithSeo = seoMeta
    ? (() => {
        const { id, entity_type, entity_id, created_at, updated_at, ...seoFields } = seoMeta;
        return {
          ...author,
          ...seoFields,
        };
      })()
    : author;
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Modifier l'auteur
        </h1>
        <p className="text-gray-400">
          {author.display_name}
        </p>
      </div>
      
      <AuthorForm siteId={siteId} siteName={site.name} author={authorWithSeo} mode="edit" />
    </div>
  );
}
