'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Ne pas afficher le header si on est dans l'admin d'un site spécifique
  const isSiteAdmin = pathname.startsWith('/admin/sites/') && pathname.split('/').length > 3;

  if (isSiteAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-white flex items-center">
                <span className="text-blue-500">⚡</span>
                <span className="ml-2">Foundry</span>
              </h1>
              <nav className="flex space-x-6">
                <Link 
                  href="/admin" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Tableau de bord
                </Link>
                <Link 
                  href="/admin/sites" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sites
                </Link>
                <Link 
                  href="/admin/content" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contenu
                </Link>
                <Link 
                  href="/admin/terms" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Taxonomies
                </Link>
                <Link 
                  href="/admin/menus" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Menus
                </Link>
                <Link 
                  href="/admin/media" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Médias
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="px-6 py-8">
        {children}
      </main>
    </>
  );
}
