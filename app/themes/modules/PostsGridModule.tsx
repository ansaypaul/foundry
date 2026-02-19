import type { PostsGridModuleConfig } from '@/lib/db/theme-types';
import PostCard from '../../components/PostCard';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  published_at?: string | Date | null;
  featured_image_url?: string | null;
  author_name?: string | null;
  category_name?: string | null;
}

interface Props {
  posts: Post[];
  config: PostsGridModuleConfig;
}

export default function PostsGridModule({ posts, config }: Props) {
  const {
    columns = 2,
    showExcerpt = true,
    showDate = true,
    showImage = true,
    showCategories = true,
    limit = 6,
  } = config;

  const displayedPosts = posts.slice(0, limit);

  if (displayedPosts.length === 0) {
    return (
      <div className="text-center py-12 rounded-lg bg-theme-bg opacity-50">
        <p className="text-theme-text">Aucun article publié pour le moment.</p>
      </div>
    );
  }

  const gridCols = columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
    : columns === 2 ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-1';

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {displayedPosts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          showImage={showImage}
          priority={index === 0}
          showCategory={showCategories}
          showExcerpt={showExcerpt}
          showDate={showDate}
          showAuthor={true}
        />
      ))}
    </div>
  );
}
