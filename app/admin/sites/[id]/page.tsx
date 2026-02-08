import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteDashboard({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();

  // Stats du site
  const [contentResult, domainsResult] = await Promise.all([
    supabase
      .from('content')
      .select('id, type, status')
      .eq('site_id', id),
    supabase
      .from('domains')
      .select('*')
      .eq('site_id', id),
  ]);

  const content = contentResult.data || [];
  const domains = domainsResult.data || [];

  const stats = {
    totalArticles: content.filter(c => c.type === 'post').length,
    totalPages: content.filter(c => c.type === 'page').length,
    published: content.filter(c => c.status === 'published').length,
    drafts: content.filter(c => c.status === 'draft').length,
    domains: domains.length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 mt-2">Aperçu de {site.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Articles</div>
          <div className="text-3xl font-bold text-white">{stats.totalArticles}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Pages</div>
          <div className="text-3xl font-bold text-white">{stats.totalPages}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Publiés</div>
          <div className="text-3xl font-bold text-white">{stats.published}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={`/admin/sites/${id}/content/new?type=post`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm text-white">Nouvel article</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/content/new?type=page`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm text-white">Nouvelle page</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/media`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm text-white">Upload média</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/menus`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🧭</div>
            <div className="text-sm text-white">Gérer menus</div>
          </Link>
        </div>
      </div>

      {/* Domaines */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Domaines ({domains.length})</h2>
        {domains.length === 0 ? (
          <p className="text-gray-400">Aucun domaine configuré</p>
        ) : (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <span className="text-white">{domain.hostname}</span>
                  {domain.is_primary && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">Principal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href={`/admin/sites/${id}/settings`}
          className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          Gérer les domaines →
        </Link>
      </div>
    </div>
  );
}
