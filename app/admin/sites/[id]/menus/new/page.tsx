import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import ImprovedMenuForm from './ImprovedMenuForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewMenuPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Nouveau menu</h1>
        <p className="text-gray-400 mt-2">Créer un menu pour {site.name}</p>
      </div>

      <ImprovedMenuForm siteId={id} />
    </div>
  );
}
