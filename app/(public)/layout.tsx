import Link from 'next/link';
import { getCurrentSite } from '@/lib/core/site-context';
import { getThemeById } from '@/lib/db/themes-queries';
import SiteMenu from './components/SiteMenu';
import SiteHeader from './components/SiteHeader';
import ThemedSiteHeader from './components/ThemedSiteHeader';
import { ThemeProvider } from './themes/ThemeProvider';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteContext = await getCurrentSite();

  // Si pas de site (ex: localhost sans sous-domaine), afficher sans header/footer
  if (!siteContext) {
    return <>{children}</>;
  }

  const { site, isPreview } = siteContext;

  // Charger le thème du site
  let theme = null;
  if ((site as any).theme_id) {
    theme = await getThemeById((site as any).theme_id);
  }

  // Si pas de thème, utiliser le layout par défaut sans thème
  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Barre de preview */}
        {isPreview && (
          <div className="bg-yellow-500 text-black py-2 px-4 text-center text-sm font-semibold sticky top-0 z-50">
            🔍 Mode Aperçu : {site.name} | <Link href={`/admin/sites/${site.id}`} className="underline hover:text-gray-800">Retour admin</Link>
          </div>
        )}
        
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <SiteHeader siteName={site.name} />
              <SiteMenu siteId={site.id} location="header" className="hidden md:flex" />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{site.name}</h3>
                <p className="text-sm text-gray-600">Propulsé par Foundry CMS</p>
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
        {/* Barre de preview */}
        {isPreview && (
          <div style={{ 
            backgroundColor: '#EAB308', 
            color: '#000', 
            padding: '0.5rem 1rem', 
            textAlign: 'center', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            🔍 Mode Aperçu : {site.name} | <Link href={`/admin/sites/${site.id}`} style={{ textDecoration: 'underline' }}>Retour admin</Link>
          </div>
        )}
        
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
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
              <ThemedSiteHeader siteName={site.name} />
              <SiteMenu siteId={site.id} location="header" className="hidden md:flex" />
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
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{site.name}</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Propulsé par Foundry CMS</p>
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
