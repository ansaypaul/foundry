import Link from 'next/link';
import { getSiteById } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getMenuByLocation } from '@/lib/db/menus-queries';
import SiteMenu from '@/app/components/SiteMenu';
import SiteHeader from '@/app/components/SiteHeader';
import ThemedSiteHeader from '@/app/components/ThemedSiteHeader';
import MobileMenu from '@/app/components/MobileMenu';
import CustomHeadCode from '@/app/components/CustomHeadCode';
import { ThemeProvider } from '@/app/themes/ThemeProvider';
import '@/app/content-styles.css';

export const revalidate = 300; // 5 minutes - active ISR pour tout le segment
export const dynamic = 'force-static'; // Force ISR même avec params dynamiques

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const { siteId } = await params;
  const site = await getSiteById(siteId);

  if (!site || site.status !== 'active') {
    return <div>Site not found</div>;
  }

  // Charger le thème du site
  let theme = null;
  if ((site as any).theme_id) {
    theme = await getThemeById((site as any).theme_id);
  }

  // Charger les items du menu pour le mobile
  const menu = await getMenuByLocation(site.id, 'header');
  let menuItems: any[] = [];
  if (menu && menu.items) {
    try {
      menuItems = typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items;
    } catch {
      menuItems = [];
    }
  }

  // Si pas de thème, utiliser le layout par défaut sans thème
  if (!theme) {
    return (
      <>
        {(site as any).custom_head_code && (
          <CustomHeadCode code={(site as any).custom_head_code} />
        )}
        
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                <SiteHeader siteName={site.name} />
                <div className="flex items-center gap-4">
                  <SiteMenu siteId={site.id} location="header" className="hidden md:flex" />
                  <MobileMenu siteName={site.name} menuItems={menuItems} />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{site.name}</h3>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Navigation</h4>
                  <SiteMenu siteId={site.id} location="footer" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">© {new Date().getFullYear()} {site.name}</p>
                  <p className="mt-2">Tous droits réservés</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
        
        {/* Code personnalisé avant la fermeture du body */}
        {(site as any).custom_footer_code && (
          <div dangerouslySetInnerHTML={{ __html: (site as any).custom_footer_code }} />
        )}
      </>
    );
  }

  // Appliquer le thème avec variables CSS
  return (
    <ThemeProvider theme={theme}>
      {(site as any).custom_head_code && (
        <CustomHeadCode code={(site as any).custom_head_code} />
      )}
      
      <div className="bg-theme-bg text-theme-text min-h-screen flex flex-col">
        {/* Header avec couleurs du thème */}
        <header className="border-b border-theme-border sticky top-0 z-50 bg-theme-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <ThemedSiteHeader siteName={site.name} />
              <div className="flex items-center gap-4">
                <SiteMenu siteId={site.id} location="header" className="hidden md:flex" />
                <MobileMenu siteName={site.name} menuItems={menuItems} />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer avec couleurs du thème */}
        <footer className="border-t border-theme-border mt-20 bg-secondary text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
              <div>
                <h3 className="text-lg font-bold mb-3">{site.name}</h3>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">
                  Navigation
                </h4>
                <SiteMenu siteId={site.id} location="footer" />
              </div>
              <div className="text-sm opacity-80">
                <p className="font-medium">© {new Date().getFullYear()} {site.name}</p>
                <p className="mt-2">Tous droits réservés</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Code personnalisé avant la fermeture du body */}
      {(site as any).custom_footer_code && (
        <div dangerouslySetInnerHTML={{ __html: (site as any).custom_footer_code }} />
      )}
    </ThemeProvider>
  );
}
