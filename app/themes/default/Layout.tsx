import { useTheme } from '../ThemeProvider';
import Link from 'next/link';

interface Props {
  siteName: string;
  menus: any;
  children: React.ReactNode;
}

export default function DefaultLayout({ siteName, menus, children }: Props) {
  const theme = useTheme();

  return (
    <div style={{ 
      backgroundColor: 'var(--color-background)', 
      color: 'var(--color-text)',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Header */}
      <header style={{ 
        borderBottom: `1px solid var(--color-border)`,
        padding: '1rem 0'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <Link 
            href="/" 
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {siteName}
          </Link>
          
          {/* Menu */}
          {menus?.header && (
            <nav style={{ marginTop: '1rem' }}>
              <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', padding: 0 }}>
                {menus.header.map((item: any) => (
                  <li key={item.id}>
                    <Link 
                      href={item.url}
                      style={{ 
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: `1px solid var(--color-border)`,
        padding: '2rem 0',
        marginTop: '4rem',
        backgroundColor: 'var(--color-secondary)',
        color: 'white'
      }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} {siteName}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
