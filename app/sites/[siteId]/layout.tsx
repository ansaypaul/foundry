import Link from 'next/link';
import { getSiteById } from '@/lib/db/queries';
import { getThemeById } from '@/lib/db/themes-queries';
import { getMenuByLocation } from '@/lib/db/menus-queries';
import SiteMenu from '@/app/components/SiteMenu';
import SiteHeader from '@/app/components/SiteHeader';
import ThemedSiteHeader from '@/app/components/ThemedSiteHeader';
import MobileMenu from '@/app/components/MobileMenu';
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
    );
  }

  // Appliquer le thème avec variables CSS
  return (
    <ThemeProvider theme={theme}>
      <div 
        style={{ 
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header avec couleurs du thème */}
        <header 
          style={{ 
            borderBottom: '1px solid var(--color-border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: 'var(--color-background)'
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
              <ThemedSiteHeader siteName={site.name} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <SiteMenu siteId={site.id} location="header" className="hidden md:flex" />
                <MobileMenu siteName={site.name} menuItems={menuItems} />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* Footer avec couleurs du thème */}
        <footer 
          style={{ 
            borderTop: '1px solid var(--color-border)',
            marginTop: '5rem',
            backgroundColor: 'var(--color-secondary)',
            color: '#fff'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{site.name}</h3>
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Navigation
                </h4>
                <SiteMenu siteId={site.id} location="footer" />
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                <p style={{ fontWeight: '500' }}>© {new Date().getFullYear()} {site.name}</p>
                <p style={{ marginTop: '0.5rem' }}>Tous droits réservés</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
