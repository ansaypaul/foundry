import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import AuthorForm from '../AuthorForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewAuthorPage({ params }: PageProps) {
  const { id: siteId } = await params;
  
  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nouvel auteur</h1>
        <p className="text-gray-400">
          Créez un nouveau profil d'auteur pour {site.name}
        </p>
      </div>
      
      <AuthorForm siteId={siteId} mode="create" />
    </div>
  );
}
