import { requireCurrentSite } from '@/lib/core/site-context';
import { getTermBySlug, getContentByTermId } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const { site } = await requireCurrentSite();

  // Trouver le tag
  const tag = await getTermBySlug(site.id, slug, 'tag');

  if (!tag) {
    notFound();
  }

  // Récupérer les articles avec ce tag
  const posts = await getContentByTermId(tag.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <span className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-full font-medium mb-4 inline-block">
          Tag
        </span>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {tag.name}
        </h1>
        {tag.description && (
          <p className="text-xl text-gray-600">
            {tag.description}
          </p>
        )}
      </div>

      {/* Articles */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Aucun article avec ce tag pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                <Link href={`/${post.slug}`} className="hover:text-blue-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-gray-600 mb-4 leading-relaxed">{post.excerpt}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                {post.published_at && (
                  <time>{new Date(post.published_at).toLocaleDateString('fr-FR')}</time>
                )}
                <Link href={`/${post.slug}`} className="text-blue-600 hover:text-blue-700 font-medium">
                  Lire la suite →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
