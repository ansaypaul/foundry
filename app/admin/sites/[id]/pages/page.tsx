import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SitePagesPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const { data: pages } = await supabase
    .from('content')
    .select('*')
    .eq('site_id', id)
    .eq('type', 'page')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pages</h1>
          <p className="text-gray-400 mt-2">Gérer les pages de {site.name}</p>
        </div>
        <Link
          href={`/admin/sites/${id}/content/new?type=page`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nouvelle page
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {!pages || pages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">Aucune page</p>
            <Link
              href={`/admin/sites/${id}/content/new?type=page`}
              className="text-blue-400 hover:text-blue-300"
            >
              Créer votre première page →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {pages.map((page) => (
              <div key={page.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{page.title}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs ${
                        page.status === 'published'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {page.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      {page.published_at && (
                        <span>{new Date(page.published_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                    {page.excerpt && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{page.excerpt}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/sites/${id}/content/${page.id}`}
                    className="ml-4 px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
