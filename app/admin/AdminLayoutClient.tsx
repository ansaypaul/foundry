'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
    >
      {isLoading ? 'Déconnexion...' : 'Déconnexion'}
    </button>
  );
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Ne pas afficher le header si on est dans l'admin d'un site spécifique
  // MAIS afficher le header pour /admin/sites/new
  const isSiteAdmin = pathname.startsWith('/admin/sites/') && 
                      pathname !== '/admin/sites/new' &&
                      pathname.split('/').length > 3;

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
                  href="/admin/editorial-content-types" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Types de contenu
                </Link>
                <Link 
                  href="/admin/users" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Utilisateurs
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
            <LogoutButton />
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
