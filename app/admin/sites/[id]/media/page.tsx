import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import SiteMediaManager from './SiteMediaManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteMediaPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Médias</h1>
        <p className="text-gray-400 mt-2">Gérez les images et fichiers de {site.name}</p>
      </div>

      <SiteMediaManager siteId={id} />
    </div>
  );
}
