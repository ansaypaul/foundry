import ModuleRenderer from '../modules/ModuleRenderer';
import type { SidebarConfig } from '@/lib/db/theme-types';

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

interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

interface Props {
  sidebar?: SidebarConfig;
  data: {
    siteName?: string;
    posts?: Post[];
    categories?: Category[];
  };
  children: React.ReactNode;
}

export default function SingleLayout({ sidebar, data, children }: Props) {
  const hasSidebar = sidebar?.enabled && sidebar.modules && sidebar.modules.length > 0;
  const sidebarPosition = sidebar?.position || 'right';

  if (!hasSidebar) {
    // Pas de sidebar, layout simple centré
    return (
      <div className="max-w-4xl mx-auto px-6">
        {children}
      </div>
    );
  }

  // Avec sidebar
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${sidebarPosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
        {/* Main content */}
        <div className={`${sidebarPosition === 'left' ? 'lg:col-start-4' : ''} lg:col-span-8`}>
          {children}
        </div>

        {/* Sidebar */}
        <aside className={`py-12 ${sidebarPosition === 'left' ? 'lg:col-start-1 lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="space-y-6 sticky top-4">
            {sidebar.modules?.map((module, index) => (
              <div key={`sidebar-${module.type}-${index}`}>
                <ModuleRenderer module={module} data={data} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
