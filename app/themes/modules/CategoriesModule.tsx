import type { CategoriesModuleConfig } from '@/lib/db/theme-types';
import PreviewLink from '../../components/PreviewLink';

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

interface Props {
  categories: Category[];
  config: CategoriesModuleConfig;
}

export default function CategoriesModule({ categories, config }: Props) {
  const {
    showCount = true,
    limit = 10,
  } = config;

  const displayedCategories = categories.slice(0, limit);

  if (displayedCategories.length === 0) {
    return null;
  }

  return (
    <div 
      className="rounded-lg p-4"
      style={{ 
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 
        className="text-lg font-bold mb-4"
        style={{ 
          color: 'var(--color-text)',
          fontFamily: 'var(--font-heading)'
        }}
      >
        Catégories
      </h3>
      <ul className="space-y-2">
        {displayedCategories.map((category) => (
          <li key={category.id}>
            <PreviewLink
              href={`/category/${category.slug}`}
              className="flex items-center justify-between hover:opacity-80 transition-opacity py-1"
            >
              <span style={{ color: 'var(--color-text)' }}>
                {category.name}
              </span>
              {showCount && category.post_count !== undefined && (
                <span 
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    opacity: 0.8
                  }}
                >
                  {category.post_count}
                </span>
              )}
            </PreviewLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
