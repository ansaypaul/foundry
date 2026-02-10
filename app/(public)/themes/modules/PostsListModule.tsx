import type { PostsListModuleConfig } from '@/lib/db/theme-types';
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
  config: PostsListModuleConfig;
}

export default function PostsListModule({ posts, config }: Props) {
  const {
    showExcerpt = true,
    showDate = true,
    showImage = true,
    style = 'default',
  } = config;

  if (posts.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
        <p>Aucun article publié pour le moment.</p>
      </div>
    );
  }

  const spacing = style === 'compact' ? 'space-y-4' : 'space-y-8';

  return (
    <div className={spacing}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showImage={showImage}
          showCategory={true}
          showExcerpt={showExcerpt}
          showDate={showDate}
          showAuthor={true}
        />
      ))}
    </div>
  );
}
