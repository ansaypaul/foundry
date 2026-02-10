import { getCurrentSite } from '@/lib/core/site-context';
import { getContentBySlug, getTermBySlug, getContentByTermId } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound, redirect } from 'next/navigation';
import PreviewLink from '../components/PreviewLink';
import Image from 'next/image';
import type { Metadata } from 'next';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'admin' || slug.startsWith('_next')) {
    return { title: 'Page' };
  }
  
  try {
    const siteContext = await getCurrentSite();
    if (!siteContext) {
      return { title: 'Page' };
    }
    
    const { site, domain } = siteContext;
    let content = await getContentBySlug(site.id, slug, 'post');
    if (!content) {
      content = await getContentBySlug(site.id, slug, 'page');
    }
    
    if (!content) {
      return { title: 'Page non trouvée' };
    }

    // Charger les settings SEO
    const settings = await getSeoSettings(site.id);
    
    // Construire le contexte SEO
    const siteUrl = domain?.hostname 
      ? `https://${domain.hostname}` 
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${site.id}`;
    const seoContext = {
      entity: content,
      entityType: 'content' as const,
      siteUrl,
      siteName: settings?.site_name || site.name,
      siteTagline: settings?.site_tagline || undefined,
      settings,
      currentPath: `/${slug}`,
    };
    
    // Résoudre les métas SEO avec fallbacks intelligents
    const resolvedSeo = await resolveSeoMeta(seoContext);
    
    // Générer l'objet Metadata pour Next.js
    return generateSeoMetadata(resolvedSeo);
  } catch (error) {
    console.error('[SEO] Error generating metadata:', error);
    return { title: 'Page' };
  }
}

export default async function ContentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  
  const siteContext = await getCurrentSite();
  if (!siteContext) {
    // Pas de site = pas de contenu public possible
    notFound();
  }
  
  const { site } = siteContext;
  
  // Vérifier si on est en mode preview (pour voir les articles draft/scheduled)
  const isPreview = preview === '1';
  let isAuthenticated = false;
  
  if (isPreview) {
    // Vérifier si l'utilisateur est connecté
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    isAuthenticated = cookieStore.has('foundry-session');
  }

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
                  <PreviewLink href={`/${post.slug}`} className="hover:text-blue-600 transition-colors">
                    {post.title}
                  </PreviewLink>
                </h2>
                {post.excerpt && (
                  <p className="text-gray-600 mb-4 leading-relaxed">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  {post.published_at && (
                    <time>{new Date(post.published_at).toLocaleDateString('fr-FR')}</time>
                  )}
                  <PreviewLink href={`/${post.slug}`} className="text-blue-600 hover:text-blue-700 font-medium">
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

  // 2. Essayer de trouver un article
  let content;
  
  if (isPreview && isAuthenticated) {
    // En mode preview, on peut voir les articles draft/scheduled
    const supabase = getSupabaseAdmin();
    const { data: previewContent } = await supabase
      .from('content')
      .select('*')
      .eq('site_id', site.id)
      .eq('slug', slug)
      .single();
    
    content = previewContent;
  } else {
    // Mode normal : seulement les articles publiés
    content = await getContentBySlug(site.id, slug, 'post');
    
    // 3. Si pas trouvé, essayer une page
    if (!content) {
      content = await getContentBySlug(site.id, slug, 'page');
    }
  }

  // 4. Si toujours pas trouvé, 404
  if (!content) {
    notFound();
  }
  
  // 5. Si l'article n'est pas publié et qu'on n'est pas authentifié, 404
  if (content.status !== 'published' && (!isPreview || !isAuthenticated)) {
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
        {/* Preview & Type badges */}
        <div className="mb-4 flex gap-2">
          {content.type === 'post' && (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
              Article
            </span>
          )}
          {isPreview && isAuthenticated && content.status !== 'published' && (
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
              👁️ Preview - {content.status === 'draft' ? 'Brouillon' : 'Programmé'}
            </span>
          )}
        </div>

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
            className="prose prose-lg max-w-none article-content"
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
          <PreviewLink 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour aux articles
          </PreviewLink>
        </div>
      </article>
    </div>
  );
}
