import { getCurrentSite } from '@/lib/core/site-context';
import { getContentBySlug, getTermBySlug, getContentByTermId } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Si le slug est "admin", ne pas traiter
  if (slug === 'admin' || slug.startsWith('_next')) {
    return { title: 'Page' };
  }
  
  try {
    const siteContext = await getCurrentSite();
    if (!siteContext) {
      return { title: 'Page' };
    }
    
    const { site } = siteContext;
    let content = await getContentBySlug(site.id, slug, 'post');
    if (!content) {
      content = await getContentBySlug(site.id, slug, 'page');
    }
    
    if (!content) {
      return { title: 'Page non trouvée' };
    }

    // Charger l'image à la une pour les métadonnées
    let featuredImage: string | undefined;
    if (content.featured_media_id) {
      const supabase = getSupabaseAdmin();
      const { data: media } = await supabase
        .from('media')
        .select('url')
        .eq('id', content.featured_media_id)
        .single();
      
      if (media) {
        featuredImage = media.url;
      }
    }

    return {
      title: `${content.title} | ${site.name}`,
      description: content.excerpt || undefined,
      openGraph: {
        title: content.title,
        description: content.excerpt || undefined,
        type: content.type === 'post' ? 'article' : 'website',
        publishedTime: content.published_at ? new Date(content.published_at).toISOString() : undefined,
        images: featuredImage ? [featuredImage] : undefined,
      },
    };
  } catch {
    return { title: 'Page' };
  }
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  
  const siteContext = await getCurrentSite();
  if (!siteContext) {
    // Pas de site = pas de contenu public possible
    notFound();
  }
  
  const { site } = siteContext;

  // 1. Vérifier si c'est une catégorie
  const category = await getTermBySlug(site.id, slug, 'category');
  if (category) {
    const posts = await getContentByTermId(category.id);
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium mb-4 inline-block">
            Catégorie
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-xl text-gray-600">
              {category.description}
            </p>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun article dans cette catégorie.</p>
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

  // 2. Essayer de trouver un article
  let content = await getContentBySlug(site.id, slug, 'post');
  
  // 3. Si pas trouvé, essayer une page
  if (!content) {
    content = await getContentBySlug(site.id, slug, 'page');
  }

  // 4. Si toujours pas trouvé, 404
  if (!content) {
    notFound();
  }

  // Charger l'image à la une si présente
  let featuredMedia: any = null;
  if (content.featured_media_id) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('id', content.featured_media_id)
      .single();
    
    featuredMedia = data;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Article/Page */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Type badge */}
        {content.type === 'post' && (
          <div className="mb-4">
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
              Article
            </span>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {content.title}
        </h1>

        {/* Métadonnées pour les articles */}
        {content.type === 'post' && content.published_at && (
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
            <time dateTime={new Date(content.published_at).toISOString()}>
              {new Date(content.published_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        )}

        {/* Extrait */}
        {content.excerpt && (
          <div className="text-xl text-gray-600 mb-8 leading-relaxed">
            {content.excerpt}
          </div>
        )}

        {/* Image à la une */}
        {featuredMedia && (
          <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
            <Image
              src={featuredMedia.url}
              alt={featuredMedia.alt_text || content.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        {/* Contenu HTML */}
        {content.content_html && (
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content_html }}
          />
        )}

        {/* Pas de contenu */}
        {!content.content_html && (
          <div className="text-gray-500 italic">
            Aucun contenu disponible.
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour aux articles
          </Link>
        </div>
      </article>
    </div>
  );
}
