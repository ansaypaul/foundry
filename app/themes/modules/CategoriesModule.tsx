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
    <div className="rounded-lg p-4 bg-theme-bg border border-theme-border">
      <h3 className="text-lg font-bold mb-4 text-theme-text font-heading">
        Catégories
      </h3>
      <ul className="space-y-2">
        {displayedCategories.map((category) => (
          <li key={category.id}>
            <PreviewLink
              href={`/category/${category.slug}`}
              className="flex items-center justify-between hover:opacity-80 transition-opacity py-1"
            >
              <span className="text-theme-text">
                {category.name}
              </span>
              {showCount && category.post_count !== undefined && (
                <span className="text-xs px-2 py-1 rounded bg-primary text-white opacity-80">
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
