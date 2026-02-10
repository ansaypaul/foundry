import type { ThemeModule } from '@/lib/db/theme-types';
import HeroModule from './HeroModule';
import PostsGridModule from './PostsGridModule';
import PostsListModule from './PostsListModule';
import RecentPostsModule from './RecentPostsModule';
import CategoriesModule from './CategoriesModule';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  published_at?: string | Date | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

interface Props {
  module: ThemeModule;
  data: {
    siteName?: string;
    siteTagline?: string;
    posts?: Post[];
    categories?: Category[];
  };
}

export default function ModuleRenderer({ module, data }: Props) {
  if (!module.enabled) {
    return null;
  }

  const config = module.config || {};

  switch (module.type) {
    case 'hero':
      return (
        <HeroModule
          siteName={data.siteName || ''}
          siteTagline={data.siteTagline}
          config={config}
        />
      );

    case 'posts_grid':
      return (
        <PostsGridModule
          posts={data.posts || []}
          config={config}
        />
      );

    case 'posts_list':
      return (
        <PostsListModule
          posts={data.posts || []}
          config={config}
        />
      );

    case 'recent_posts':
      return (
        <RecentPostsModule
          posts={data.posts || []}
          config={config}
        />
      );

    case 'categories':
      return (
        <CategoriesModule
          categories={data.categories || []}
          config={config}
        />
      );

    default:
      console.warn(`Module type "${module.type}" not found`);
      return null;
  }
}
