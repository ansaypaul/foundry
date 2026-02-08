import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function SiteAdminLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  // Charger les domaines du site
  const supabase = getSupabaseAdmin();
  const { data: domains } = await supabase
    .from('domains')
    .select('hostname, is_primary')
    .eq('site_id', id)
    .order('is_primary', { ascending: false });

  const primaryDomain = domains?.find(d => d.is_primary)?.hostname || domains?.[0]?.hostname;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Site header */}
        <div className="p-6 border-b border-gray-700">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white mb-2 block">
            ← Tous les sites
          </Link>
          <h2 className="text-xl font-bold text-white">{site.name}</h2>
          <p className="text-sm text-gray-400 mt-1 capitalize">{site.status}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink href={`/admin/sites/${id}`} icon="📊">
            Tableau de bord
          </NavLink>
          <NavLink href={`/admin/sites/${id}/posts`} icon="📝">
            Articles
          </NavLink>
          <NavLink href={`/admin/sites/${id}/pages`} icon="📄">
            Pages
          </NavLink>
          <NavLink href={`/admin/sites/${id}/terms`} icon="🏷️">
            Taxonomies
          </NavLink>
          <NavLink href={`/admin/sites/${id}/media`} icon="🖼️">
            Médias
          </NavLink>
          <NavLink href={`/admin/sites/${id}/menus`} icon="🧭">
            Menus
          </NavLink>
          <NavLink href={`/admin/sites/${id}/users`} icon="👥">
            Utilisateurs
          </NavLink>
          <NavLink href={`/admin/sites/${id}/theme`} icon="🎨">
            Thème
          </NavLink>
          <NavLink href={`/admin/sites/${id}/settings`} icon="⚙️">
            Paramètres
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {primaryDomain && (
            <a
              href={`http://${primaryDomain}:3000`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2 text-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Voir le site →
            </a>
          )}
          
          <a
            href={`/preview/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 text-center text-sm bg-yellow-600 text-black rounded hover:bg-yellow-700 transition-colors"
          >
            🔍 Aperçu (test)
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
    >
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
