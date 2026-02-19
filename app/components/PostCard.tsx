import PreviewLink from './PreviewLink';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  published_at?: string | Date | null;
  featured_image_url?: string | null;
  author_name?: string | null; // Legacy
  author?: {
    id: string;
    display_name: string;
    slug: string;
    avatar_url?: string | null;
  };
  category_name?: string | null;
}

interface Props {
  post: Post;
  showImage?: boolean;
  showCategory?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  priority?: boolean;
}

export default function PostCard({ 
  post, 
  showImage = true,
  showCategory = true,
  showExcerpt = true,
  showDate = true,
  showAuthor = true,
  priority = false
}: Props) {
  return (
    <article className="group rounded-lg overflow-hidden transition-shadow hover:shadow-lg bg-theme-bg border border-theme-border">
      {/* Image */}
      {showImage && post.featured_image_url && (
        <PreviewLink href={`/${post.slug}`} className="block relative aspect-video overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </PreviewLink>
      )}

      <div className="p-6">
        {/* Badge catégorie */}
        {showCategory && post.category_name && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase rounded bg-primary text-white">
              {post.category_name}
            </span>
          </div>
        )}

        {/* Titre */}
        <h2 className="text-xl font-bold mb-3 group-hover:opacity-80 transition-opacity text-theme-text font-heading">
          <PreviewLink href={`/${post.slug}`}>
            {post.title}
          </PreviewLink>
        </h2>

        {/* Extrait */}
        {showExcerpt && post.excerpt && (
          <p className="mb-4 leading-relaxed line-clamp-3 text-theme-text opacity-80">
            {post.excerpt}
          </p>
        )}

        {/* Meta (auteur + date) */}
        {(showAuthor || showDate) && (
          <div className="flex items-center gap-2 text-sm pt-4 border-t border-theme-border text-theme-text opacity-70">
            {showAuthor && (post.author || post.author_name) && (
              <>
                <span className="font-medium">
                  {post.author ? post.author.display_name : post.author_name}
                </span>
                {showDate && post.published_at && <span>/</span>}
              </>
            )}
            {showDate && post.published_at && (
              <time dateTime={new Date(post.published_at).toISOString()}>
                {new Date(post.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
