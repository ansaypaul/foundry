import { getCurrentSite } from '@/lib/core/site-context';
import { getPublishedPostsBySiteId } from '@/lib/db/queries';
import PreviewLink from './components/PreviewLink';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteContext = await getCurrentSite();
    if (!siteContext) {
      return { title: 'Admin' };
    }
    const { site } = siteContext;
    return {
      title: site.name,
      description: `Bienvenue sur ${site.name}`,
    };
  } catch {
    return { title: 'Site' };
  }
}

export default async function HomePage() {
  const siteContext = await getCurrentSite();
  
  // Si pas de site, rediriger vers l'admin
  if (!siteContext) {
    redirect('/admin');
  }
  
  const { site } = siteContext;
  const posts = await getPublishedPostsBySiteId(site.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenue sur {site.name}
        </h1>
        <p className="text-xl text-gray-600">
          Découvrez nos derniers articles
        </p>
      </div>

      {/* Articles list */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucun article publié pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                <PreviewLink
                  href={`/${post.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </PreviewLink>
              </h2>

              {post.excerpt && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                {post.published_at && (
                  <time dateTime={new Date(post.published_at).toISOString()}>
                    {new Date(post.published_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
                <PreviewLink
                  href={`/${post.slug}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lire la suite →
                </PreviewLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
