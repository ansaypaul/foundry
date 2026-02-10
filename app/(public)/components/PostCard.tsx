import PreviewLink from './PreviewLink';
import Image from 'next/image';

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
  post: Post;
  showImage?: boolean;
  showCategory?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
}

export default function PostCard({ 
  post, 
  showImage = true,
  showCategory = true,
  showExcerpt = true,
  showDate = true,
  showAuthor = true
}: Props) {
  return (
    <article 
      className="group rounded-lg overflow-hidden transition-shadow hover:shadow-lg"
      style={{ 
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Image */}
      {showImage && post.featured_image_url && (
        <PreviewLink href={`/${post.slug}`} className="block relative aspect-video overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </PreviewLink>
      )}

      <div className="p-6">
        {/* Badge catégorie */}
        {showCategory && post.category_name && (
          <div className="mb-3">
            <span 
              className="inline-block px-3 py-1 text-xs font-semibold uppercase rounded"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              {post.category_name}
            </span>
          </div>
        )}

        {/* Titre */}
        <h2 
          className="text-xl font-bold mb-3 group-hover:opacity-80 transition-opacity"
          style={{ 
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <PreviewLink href={`/${post.slug}`}>
            {post.title}
          </PreviewLink>
        </h2>

        {/* Extrait */}
        {showExcerpt && post.excerpt && (
          <p 
            className="mb-4 leading-relaxed line-clamp-3"
            style={{ 
              color: 'var(--color-text)',
              opacity: 0.8
            }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Meta (auteur + date) */}
        {(showAuthor || showDate) && (
          <div 
            className="flex items-center gap-2 text-sm pt-4"
            style={{ 
              borderTop: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              opacity: 0.7
            }}
          >
            {showAuthor && post.author_name && (
              <>
                <span className="font-medium">{post.author_name}</span>
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
