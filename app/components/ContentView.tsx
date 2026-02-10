import { getPublishedPostsBySiteId, getCategoriesWithCount, getSiteById } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import PreviewLink from '@/app/components/PreviewLink';
import SingleLayout from '@/app/themes/layouts/SingleLayout';
import Image from 'next/image';
import type { Content } from '@/lib/db/types';

interface ContentViewProps {
  content: Content & { seo_title?: string; seo_description?: string };
  siteId: string;
  siteName: string;
  isPreview?: boolean;
  isAuthenticated?: boolean;
}

export default async function ContentView({ 
  content, 
  siteId, 
  siteName,
  isPreview = false,
  isAuthenticated = false 
}: ContentViewProps) {
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

  // Récupérer la config du thème pour les articles
  const fullSite = await getSiteById(siteId);
  const theme = fullSite?.theme_id ? await getThemeById(fullSite.theme_id) : null;
  
  const defaultSingleConfig = {
    sidebar: {
      enabled: true,
      position: 'right' as const,
      modules: [
        { type: 'recent_posts', enabled: true, config: { limit: 5 } }
      ]
    }
  };

  const siteModulesConfig = (fullSite as any)?.theme_config?.modules_config?.single;
  const themeModulesConfig = (theme as any)?.modules_config?.single;
  const singleConfig = siteModulesConfig || themeModulesConfig || defaultSingleConfig;

  // Récupérer les données pour la sidebar
  const recentPosts = content.type === 'post' ? await getPublishedPostsBySiteId(siteId, 5) : [];
  const categories = content.type === 'post' ? await getCategoriesWithCount(siteId) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <SingleLayout 
        sidebar={content.type === 'post' ? singleConfig.sidebar : undefined}
        data={{
          siteName,
          posts: recentPosts,
          categories,
        }}
      >
        <article className="py-12">
          {/* Preview & Type badges */}
          <div className="mb-4 flex gap-2">
            {content.type === 'post' && (
              <span 
                className="px-3 py-1 text-sm rounded-full font-medium"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                Article
              </span>
            )}
            {isPreview && isAuthenticated && content.status !== 'published' && (
              <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
                🔍 Preview - {content.status === 'draft' ? 'Brouillon' : 'Programmé'}
              </span>
            )}
          </div>

          {/* Titre */}
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {content.title}
          </h1>

          {/* Métadonnées pour les articles */}
          {content.type === 'post' && (
            <div 
              className="flex items-center gap-4 text-sm mb-8 pb-8"
              style={{ 
                color: 'var(--color-text)',
                opacity: 0.7,
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              {/* Auteur */}
              {(content as any).author && (
                <div className="flex items-center gap-2">
                  {(content as any).author.avatar_url && (
                    <Image
                      src={(content as any).author.avatar_url}
                      alt={(content as any).author.display_name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      style={{ width: '32px', height: '32px' }}
                    />
                  )}
                  <PreviewLink 
                    href={`/author/${(content as any).author.slug}`}
                    className="font-medium hover:opacity-80"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {(content as any).author.display_name}
                  </PreviewLink>
                </div>
              )}
              
              {/* Date de publication */}
              {content.published_at && (
                <>
                  {(content as any).author && <span>•</span>}
                  <time dateTime={new Date(content.published_at).toISOString()}>
                    {new Date(content.published_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </>
              )}
            </div>
          )}

          {/* Extrait */}
          {content.excerpt && (
            <div 
              className="text-xl mb-8 leading-relaxed"
              style={{ 
                color: 'var(--color-text)',
                opacity: 0.8
              }}
            >
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
                priority={true}
                loading="eager"
                sizes="(max-width: 768px) 100vw, 896px"
                {...({ fetchPriority: 'high' } as any)}
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
            <div style={{ color: 'var(--color-text)', opacity: 0.5 }} className="italic">
              Aucun contenu disponible.
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
            <PreviewLink 
              href="/" 
              className="inline-flex items-center font-medium hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-primary)' }}
            >
              ← Retour aux articles
            </PreviewLink>
          </div>
        </article>
      </SingleLayout>
    </div>
  );
}
