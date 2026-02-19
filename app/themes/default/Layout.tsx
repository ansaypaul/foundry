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
    <div className="bg-theme-bg text-theme-text min-h-screen font-body">
      {/* Header */}
      <header className="border-b border-theme-border py-4">
        <div className="max-w-7xl mx-auto px-6">
          <Link 
            href="/" 
            className="text-2xl font-bold text-primary no-underline font-heading"
          >
            {siteName}
          </Link>
          
          {/* Menu */}
          {menus?.header && (
            <nav className="mt-4">
              <ul className="flex gap-6 list-none p-0">
                {menus.header.map((item: any) => (
                  <li key={item.id}>
                    <Link 
                      href={item.url}
                      className="text-theme-text no-underline transition-colors duration-200"
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
      <footer className="border-t border-theme-border py-8 mt-16 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} {siteName}. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
