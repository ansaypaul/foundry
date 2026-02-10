import { getAuthorsBySiteId } from '@/lib/db/authors-queries';
import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DeleteAuthorButton from './DeleteAuthorButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AuthorsPage({ params }: PageProps) {
  const { id: siteId } = await params;
  
  const site = await getSiteById(siteId);
  if (!site) {
    notFound();
  }
  
  const authors = await getAuthorsBySiteId(siteId);
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Auteurs</h1>
          <p className="text-gray-400">
            Gérez les profils publics des auteurs de votre site
          </p>
        </div>
        <Link
          href={`/admin/sites/${siteId}/authors/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvel auteur
        </Link>
      </div>
      
      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-200">
          💡 <strong>Note :</strong> Les auteurs sont des profils publics affichés sur votre site. 
          Ils sont différents des utilisateurs qui gèrent votre site dans l'admin.
        </p>
      </div>
      
      {/* Liste des auteurs */}
      {authors.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <p className="text-gray-400 mb-4">Aucun auteur pour le moment</p>
          <Link
            href={`/admin/sites/${siteId}/authors/new`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer votre premier auteur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div
              key={author.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
            >
              {/* Avatar et nom */}
              <div className="flex items-start gap-4 mb-4">
                {author.avatar_url ? (
                  <Image
                    src={author.avatar_url}
                    alt={author.display_name}
                    width={64}
                    height={64}
                    className="rounded-full flex-shrink-0 object-cover"
                    style={{ width: '64px', height: '64px' }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-gray-400">
                      {author.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {author.display_name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {author.posts_count} article{author.posts_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Bio (tronquée) */}
              {author.bio && (
                <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                  {author.bio}
                </p>
              )}
              
              {/* Liens sociaux */}
              {(author.website_url || author.twitter_username || author.linkedin_url) && (
                <div className="flex gap-2 mb-4 text-xs">
                  {author.website_url && (
                    <span className="text-gray-400">🌐</span>
                  )}
                  {author.twitter_username && (
                    <span className="text-gray-400">🐦</span>
                  )}
                  {author.linkedin_url && (
                    <span className="text-gray-400">💼</span>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Link
                  href={`/admin/sites/${siteId}/authors/${author.id}`}
                  className="flex-1 px-3 py-2 text-sm text-center bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Modifier
                </Link>
                <DeleteAuthorButton
                  siteId={siteId}
                  authorId={author.id}
                  authorName={author.display_name}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
