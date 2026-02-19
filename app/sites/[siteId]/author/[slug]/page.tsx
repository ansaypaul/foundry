import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSiteById, getPrimaryDomainBySiteId, getCategoriesWithCount } from '@/lib/db/queries';
import { getAuthorBySlug } from '@/lib/db/authors-queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { resolveSeoMeta, generateMetadata as generateSeoMetadata, getSeoSettings } from '@/lib/core/seo';
import JsonLd from '@/app/components/JsonLd';
import Image from 'next/image';
import PageLayout from '@/app/themes/layouts/PageLayout';
import type { Theme } from '@/lib/db/theme-types';

export const revalidate = 300;

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
  
  const supabase = getSupabaseAdmin();
  const { data: rawPosts } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('new_author_id', author.id)
    .eq('type', 'post')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const enrichedPosts = await Promise.all(
    (rawPosts || []).map(async (post: any) => {
      const { data: media } = post.featured_media_id
        ? await supabase.from('media').select('url').eq('id', post.featured_media_id).single()
        : { data: null };

      const { data: termRel } = await supabase
        .from('content_terms')
        .select('term_id')
        .eq('content_id', post.id)
        .limit(1)
        .single();

      let categoryName: string | null = null;
      if (termRel) {
        const { data: term } = await supabase
          .from('terms')
          .select('name')
          .eq('id', termRel.term_id)
          .eq('taxonomy', 'category')
          .single();
        categoryName = term?.name || null;
      }

      return {
        ...post,
        author_name: author.display_name,
        featured_image_url: media?.url || null,
        category_name: categoryName,
      };
    })
  );

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

  const theme = site.theme_id ? await getThemeById(site.theme_id) : null;
  const categories = await getCategoriesWithCount(siteId);

  const defaultConfig = {
    layout: 'default' as const,
    modules: [
      {
        type: 'posts_grid',
        enabled: true,
        config: { columns: 3, showExcerpt: true, showDate: true, showCategories: true, showImage: true }
      }
    ],
    sidebar: {
      enabled: false,
      position: 'right' as const,
      modules: []
    }
  };

  const siteModulesConfig = (site as any)?.theme_config?.modules_config?.author;
  const themeModulesConfig = (theme as Theme)?.modules_config?.author;
  const authorConfig = siteModulesConfig || themeModulesConfig || defaultConfig;

  const socialLinks = [
    author.website_url && { href: author.website_url, label: 'Site web' },
    author.twitter_username && { href: `https://twitter.com/${author.twitter_username}`, label: 'Twitter' },
    author.facebook_url && { href: author.facebook_url, label: 'Facebook' },
    author.linkedin_url && { href: author.linkedin_url, label: 'LinkedIn' },
    author.instagram_username && { href: `https://instagram.com/${author.instagram_username}`, label: 'Instagram' },
    author.github_username && { href: `https://github.com/${author.github_username}`, label: 'GitHub' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <JsonLd schemas={schemas} />
      
      <div>
        {/* En-tête auteur */}
        <div className="py-12 mb-8 bg-theme-bg border-b border-theme-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {author.avatar_url && (
                <div className="flex-shrink-0">
                  <Image
                    src={author.avatar_url}
                    alt={author.display_name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover w-[120px] h-[120px]"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-theme-text font-heading mb-2">
                  {author.display_name}
                </h1>
                
                {author.bio && (
                  <div 
                    className="text-lg text-theme-text opacity-80 mb-4 prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: author.bio }}
                  />
                )}
                
                <div className="flex items-center gap-4 text-sm text-theme-text opacity-60 mb-4">
                  <span>{author.posts_count} article{author.posts_count > 1 ? 's' : ''}</span>
                </div>
                
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:opacity-80 text-sm transition-opacity"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Articles avec sidebar */}
        <PageLayout
          config={authorConfig}
          data={{
            siteName: site.name,
            posts: enrichedPosts,
            categories,
          }}
        />
      </div>
    </>
  );
}
