import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteById, getPrimaryDomainBySiteId } from '@/lib/db/queries';
import { getAuthorBySlug } from '@/lib/db/authors-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import JsonLd from '@/app/components/JsonLd';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 300; // 5 minutes

interface PageProps {
  params: Promise<{ siteId: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId, slug } = await params;
  
  try {
    const site = await getSiteById(siteId);
    const author = await getAuthorBySlug(siteId, slug);
    
    if (!site || !author) {
      return { title: 'Auteur non trouvé' };
    }
    
    const settings = await getSeoSettings(siteId);
    const domain = await getPrimaryDomainBySiteId(siteId);
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${siteId}`;
    
    // Créer une entité fictive pour le SEO de l'auteur
    const authorEntity = {
      seo_title: `${author.display_name} - Auteur`,
      seo_description: author.bio || `Découvrez les articles de ${author.display_name}`,
      seo_og_image: author.avatar_url,
      seo_robots_index: true,
      seo_robots_follow: true,
    };
    
    const seoContext = {
      entity: authorEntity as any,
      entityType: 'content' as const,
      siteUrl,
      siteName: settings?.site_name || site.name,
      siteTagline: settings?.site_tagline || undefined,
      settings,
      currentPath: `/author/${slug}`,
    };
    
    const resolvedSeo = await resolveSeoMeta(seoContext);
    return generateSeoMetadata(resolvedSeo);
  } catch (error) {
    console.error('[SEO] Error generating author metadata:', error);
    return { title: 'Auteur' };
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { siteId, slug } = await params;
  
  const site = await getSiteById(siteId);
  const author = await getAuthorBySlug(siteId, slug);
  
  if (!site || !author) {
    notFound();
  }
  
  // Récupérer les articles de l'auteur
  const supabase = getSupabaseAdmin();
  const { data: posts } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('new_author_id', author.id)
    .eq('type', 'post')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  
  // Générer les schémas JSON-LD pour l'auteur
  const settings = await getSeoSettings(siteId);
  const domain = await getPrimaryDomainBySiteId(siteId);
  const siteUrl = domain?.hostname 
    ? `https://${domain.hostname}` 
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${siteId}`;
  
  const schemas = [
    {
      '@context': 'https://schema.org' as const,
      '@type': 'ProfilePage' as const,
      mainEntity: {
        '@type': 'Person' as const,
        name: author.display_name,
        description: author.bio || undefined,
        image: author.avatar_url || undefined,
        url: author.website_url || undefined,
        sameAs: [
          author.twitter_username ? `https://twitter.com/${author.twitter_username}` : null,
          author.facebook_url,
          author.linkedin_url,
          author.instagram_username ? `https://instagram.com/${author.instagram_username}` : null,
          author.github_username ? `https://github.com/${author.github_username}` : null,
        ].filter((url): url is string => url !== null),
      },
    },
  ];
  
  return (
    <>
      <JsonLd schemas={schemas} />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* En-tête auteur */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            {author.avatar_url && (
              <div className="flex-shrink-0">
                <Image
                  src={author.avatar_url}
                  alt={author.display_name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                  style={{ width: '120px', height: '120px' }}
                />
              </div>
            )}
            
            {/* Informations */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {author.display_name}
              </h1>
              
              {author.bio && (
                <p className="text-lg text-gray-600 mb-4">
                  {author.bio}
                </p>
              )}
              
              {/* Statistiques */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{author.posts_count} article{author.posts_count > 1 ? 's' : ''}</span>
              </div>
              
              {/* Liens sociaux */}
              {(author.website_url || author.twitter_username || author.facebook_url || 
                author.linkedin_url || author.instagram_username || author.github_username) && (
                <div className="flex flex-wrap gap-3">
                  {author.website_url && (
                    <a
                      href={author.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      🌐 Site web
                    </a>
                  )}
                  {author.twitter_username && (
                    <a
                      href={`https://twitter.com/${author.twitter_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      🐦 Twitter
                    </a>
                  )}
                  {author.facebook_url && (
                    <a
                      href={author.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      📘 Facebook
                    </a>
                  )}
                  {author.linkedin_url && (
                    <a
                      href={author.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      💼 LinkedIn
                    </a>
                  )}
                  {author.instagram_username && (
                    <a
                      href={`https://instagram.com/${author.instagram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      📷 Instagram
                    </a>
                  )}
                  {author.github_username && (
                    <a
                      href={`https://github.com/${author.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      💻 GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Articles de l'auteur */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Articles de {author.display_name}
          </h2>
          
          {posts && posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <Link href={`/${post.slug}`} className="group">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="text-sm text-gray-500">
                      {post.published_at && new Date(post.published_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">
              Aucun article publié pour le moment.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
