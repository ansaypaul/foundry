import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import ContentForm from './ContentForm';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function NewSiteContentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  
  const site = await getSiteById(id);
  if (!site) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Créer {type === 'page' ? 'une page' : 'un article'}</h1>
        <p className="text-gray-400 mt-2">Nouveau contenu pour {site.name}</p>
      </div>

      <ContentForm 
        siteId={id} 
        type={(type as 'post' | 'page') || 'post'}
        returnUrl={`/admin/sites/${id}/content`}
      />
    </div>
  );
}

