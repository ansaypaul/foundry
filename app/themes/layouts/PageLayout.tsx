import type { PageModulesConfig } from '@/lib/db/theme-types';
import ModuleRenderer from '../modules/ModuleRenderer';

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
  config: PageModulesConfig;
  data: {
    siteName?: string;
    siteTagline?: string;
    posts?: Post[];
    categories?: Category[];
  };
}

export default function PageLayout({ config, data }: Props) {
  const { layout, modules, sidebar } = config;
  
  const hasSidebar = sidebar?.enabled && sidebar.modules && sidebar.modules.length > 0;
  const sidebarPosition = sidebar?.position || 'right';

  // Layout sans sidebar (centré ou pleine largeur)
  if (!hasSidebar) {
    const maxWidth = layout === 'full_width' ? 'max-w-full' : layout === 'centered' ? 'max-w-4xl' : 'max-w-7xl';
    
    return (
      <div className={`${maxWidth} mx-auto px-6 py-12`}>
        {modules.map((module, index) => (
          <div key={`${module.type}-${index}`} className="mb-8">
            <ModuleRenderer module={module} data={data} />
          </div>
        ))}
      </div>
    );
  }

  // Layout avec sidebar
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${sidebarPosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
        {/* Main content */}
        <div className={`${sidebarPosition === 'left' ? 'lg:col-start-4' : ''} lg:col-span-8`}>
          {modules.map((module, index) => (
            <div key={`${module.type}-${index}`} className="mb-8">
              <ModuleRenderer module={module} data={data} />
            </div>
          ))}
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
