import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/db/client';

export default async function UsersPage() {
  const supabase = getSupabaseAdmin();

  // Récupérer tous les utilisateurs avec leurs sites
  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      memberships (
        site_id,
        role,
        sites (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Utilisateurs</h1>
          <p className="text-gray-400 mt-2">Gérer les utilisateurs de la plateforme</p>
        </div>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvel utilisateur
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Sites
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date de création
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {user.name || 'Sans nom'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {user.memberships?.length || 0} site(s)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-blue-400 hover:text-blue-300 mr-4"
                  >
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  Aucun utilisateur
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
