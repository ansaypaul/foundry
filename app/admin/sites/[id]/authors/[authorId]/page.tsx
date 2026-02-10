import { getSiteById } from '@/lib/db/queries';
import { getAuthorById } from '@/lib/db/authors-queries';
import { notFound } from 'next/navigation';
import AuthorForm from '../AuthorForm';

interface PageProps {
  params: Promise<{ id: string; authorId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditAuthorPage({ params }: PageProps) {
  const { id: siteId, authorId } = await params;
  
  const [site, author] = await Promise.all([
    getSiteById(siteId),
    getAuthorById(authorId),
  ]);
  
  if (!site || !author) {
    notFound();
  }
  
  // Vérifier que l'auteur appartient bien au site
  if (author.site_id !== siteId) {
    notFound();
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Modifier l'auteur
        </h1>
        <p className="text-gray-400">
          {author.display_name}
        </p>
      </div>
      
      <AuthorForm siteId={siteId} author={author} mode="edit" />
    </div>
  );
}
