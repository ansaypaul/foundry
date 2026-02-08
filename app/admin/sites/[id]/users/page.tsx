import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SiteUsersPage({ params }: PageProps) {
  const { id: siteId } = await params;
  const site = await getSiteById(siteId);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();

  // Récupérer tous les utilisateurs avec accès à ce site
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      id,
      role,
      created_at,
      users (
        id,
        name,
        email
      )
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  // Récupérer tous les utilisateurs pour pouvoir en ajouter
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, email')
    .order('name');

  // Utilisateurs qui ont déjà accès
  const userIdsWithAccess = memberships?.map((m: any) => m.users.id) || [];

  // Utilisateurs disponibles (sans accès encore)
  const availableUsers = allUsers?.filter(
    (u) => !userIdsWithAccess.includes(u.id)
  ) || [];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Utilisateurs du site</h1>
        <p className="text-gray-400 mt-2">Gérer les personnes ayant accès à {site.name}</p>
      </div>

      {/* Liste des utilisateurs actuels */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Accès actuels</h2>
        </div>

        {memberships && memberships.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Depuis
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {memberships.map((membership: any) => (
                <tr key={membership.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {membership.users.name || 'Sans nom'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{membership.users.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-900/50 text-blue-300 rounded capitalize">
                      {membership.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {new Date(membership.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/users/${membership.users.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-gray-400">
            Aucun utilisateur n'a accès à ce site
          </div>
        )}
      </div>

      {/* Ajouter un utilisateur */}
      {availableUsers.length > 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ajouter un utilisateur</h2>
          <p className="text-sm text-gray-400 mb-4">
            Sélectionnez un utilisateur existant dans la liste ci-dessous pour lui donner accès à ce site.
          </p>
          <div className="space-y-2">
            {availableUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <span className="text-blue-400 text-sm">+ Ajouter →</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <p className="text-gray-400 mb-4">Tous les utilisateurs ont déjà accès à ce site</p>
          <Link
            href="/admin/users/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un nouvel utilisateur
          </Link>
        </div>
      )}

      {/* Lien vers la gestion globale */}
      <div className="mt-6 text-center">
        <Link
          href="/admin/users"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          → Voir tous les utilisateurs de la plateforme
        </Link>
      </div>
    </div>
  );
}
