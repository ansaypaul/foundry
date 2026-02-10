import { getContentByTermId, getCategoriesWithCount, getSiteById } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import PageLayout from '@/app/themes/layouts/PageLayout';
import type { Theme } from '@/lib/db/theme-types';
import type { Term } from '@/lib/db/types';

interface CategoryViewProps {
  category: Term & { seo_title?: string; seo_description?: string };
  siteId: string;
  siteName: string;
}

export default async function CategoryView({ category, siteId, siteName }: CategoryViewProps) {
  // R├®cup├®rer les articles de cette cat├®gorie (enrichis avec auteur + image)
  const rawPosts = await getContentByTermId(category.id);
  
  // Enrichir avec les donn├®es manquantes (auteur, image, cat├®gorie)
  const supabase = getSupabaseAdmin();
  const enrichedPosts = await Promise.all(
    rawPosts.map(async (post: any) => {
      // R├®cup├®rer l'auteur
      const { data: author } = await supabase.from('users').select('name').eq('id', post.author_id).single();
      // R├®cup├®rer l'image
      const { data: media } = post.featured_media_id 
        ? await supabase.from('media').select('url').eq('id', post.featured_media_id).single()
        : { data: null };
      
      return {
        ...post,
        author_name: author?.name || null,
        featured_image_url: media?.url || null,
        category_name: category.name,
      };
    })
  );

  // R├®cup├®rer le th├¿me et la config
  const fullSite = await getSiteById(siteId);
  const theme = fullSite?.theme_id ? await getThemeById(fullSite.theme_id) : null;
  
  const defaultConfig = {
    layout: 'default' as const,
    modules: [
      {
        type: 'posts_grid',
        enabled: true,
        config: { columns: 2, showExcerpt: true, showDate: true, showCategories: false }
      }
    ],
    sidebar: {
      enabled: true,
      position: 'right' as const,
      modules: [
        { type: 'categories', enabled: true, config: {} }
      ]
    }
  };

  const siteModulesConfig = (fullSite as any)?.theme_config?.modules_config?.category;
  const themeModulesConfig = (theme as any)?.modules_config?.category;
  const categoryConfig = siteModulesConfig || themeModulesConfig || defaultConfig;

  // R├®cup├®rer les cat├®gories pour la sidebar
  const categories = await getCategoriesWithCount(siteId);

  return (
    <div>
      {/* Header cat├®gorie */}
      <div 
        className="py-12 mb-8"
        style={{ 
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <span 
            className="inline-block px-3 py-1 text-sm rounded-full font-medium mb-4"
            style={{ 
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            Cat├®gorie
          </span>
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ 
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {category.name}
          </h1>
          {category.description && (
            <p 
              className="text-xl"
              style={{ 
                color: 'var(--color-text)',
                opacity: 0.8
              }}
            >
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Layout avec modules configurables */}
      <PageLayout
        config={categoryConfig}
        data={{
          siteName,
          posts: enrichedPosts,
          categories,
        }}
      />
    </div>
  );
}
