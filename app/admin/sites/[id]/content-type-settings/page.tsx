import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ContentTypeSettingsManager from './ContentTypeSettingsManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteContentTypeSettingsPage({ params }: PageProps) {
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
        <h1 className="text-3xl font-bold text-white mt-2">Types de contenu</h1>
        <p className="text-gray-400 mt-2">
          Gérez les types d'articles disponibles pour {site.name}
        </p>
      </div>

      <ContentTypeSettingsManager siteId={id} />
    </div>
  );
}
