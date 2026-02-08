import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import SiteTermEditForm from './SiteTermEditForm';

interface PageProps {
  params: Promise<{ id: string; termId: string }>;
}

export default async function EditTermPage({ params }: PageProps) {
  const { id, termId } = await params;
  
  const site = await getSiteById(id);
  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const { data: term } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single();

  if (!term || term.site_id !== id) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Modifier la taxonomie</h1>
        <p className="text-gray-400 mt-2">{term.name}</p>
      </div>

      <SiteTermEditForm term={term} siteId={id} />
    </div>
  );
}
