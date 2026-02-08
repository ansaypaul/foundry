import { notFound } from 'next/navigation';
import { getSiteById } from '@/lib/db/queries';
import MediaEditForm from './MediaEditForm';

interface PageProps {
  params: Promise<{
    id: string;
    mediaId: string;
  }>;
  searchParams: Promise<{
    returnUrl?: string;
  }>;
}

export default async function MediaEditPage({ params, searchParams }: PageProps) {
  const { id, mediaId } = await params;
  const { returnUrl } = await searchParams;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return (
    <MediaEditForm
      mediaId={mediaId}
      siteId={id}
      returnUrl={returnUrl}
    />
  );
}
