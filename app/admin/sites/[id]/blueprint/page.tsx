import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlueprintViewer from './BlueprintViewer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlueprintPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          href={`/admin/sites/${id}`}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">Blueprint</h1>
        <p className="text-gray-400 mt-2">
          Snapshot de la configuration actuelle du site
        </p>
      </div>

      <BlueprintViewer siteId={id} />

      <div className="mt-6">
        <Link
          href={`/admin/sites/${id}/blueprints`}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Voir toutes les versions →
        </Link>
      </div>
    </div>
  );
}
