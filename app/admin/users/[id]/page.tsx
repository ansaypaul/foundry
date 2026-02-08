import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/db/client';
import UserEditForm from './UserEditForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Récupérer l'utilisateur avec ses memberships
  const { data: user } = await supabase
    .from('users')
    .select(`
      *,
      memberships (
        id,
        site_id,
        role,
        sites (
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (!user) {
    notFound();
  }

  // Récupérer tous les sites pour l'ajout de membership
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .order('name');

  return (
    <UserEditForm
      user={user}
      allSites={sites || []}
    />
  );
}
