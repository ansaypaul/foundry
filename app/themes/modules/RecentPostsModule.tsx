import type { RecentPostsModuleConfig } from '@/lib/db/theme-types';
import PreviewLink from '../../components/PreviewLink';

interface Post {
  id: string;
  title: string;
  slug: string;
  published_at?: string | Date | null;
}

interface Props {
  posts: Post[];
  config: RecentPostsModuleConfig;
}

export default function RecentPostsModule({ posts, config }: Props) {
  const {
    limit = 5,
    showDate = true,
  } = config;

  const displayedPosts = posts.slice(0, limit);

  if (displayedPosts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg p-4 bg-theme-bg border border-theme-border">
      <h3 className="text-lg font-bold mb-4 text-theme-text font-heading">
        Articles récents
      </h3>
      <ul className="space-y-3">
        {displayedPosts.map((post) => (
          <li key={post.id} className="pb-3 border-b border-theme-border">
            <PreviewLink
              href={`/${post.slug}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <h4 className="text-sm font-medium mb-1 text-theme-text">
                {post.title}
              </h4>
              {showDate && post.published_at && (
                <time 
                  className="text-xs text-theme-text opacity-60"
                  dateTime={new Date(post.published_at).toISOString()}
                >
                  {new Date(post.published_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              )}
            </PreviewLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
