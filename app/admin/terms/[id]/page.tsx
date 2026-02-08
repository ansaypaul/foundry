import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import TermEditForm from './TermEditForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTermPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  
  const { data: term, error } = await supabase
    .from('terms')
    .select(`
      *,
      site:sites(name)
    `)
    .eq('id', id)
    .single();

  if (error || !term) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Modifier {term.type === 'category' ? 'la catégorie' : 'le tag'}
        </h2>
        <p className="text-gray-600 mt-2">{term.name}</p>
      </div>

      <TermEditForm term={term} />
    </div>
  );
}
