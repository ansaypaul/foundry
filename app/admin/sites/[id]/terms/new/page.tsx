import { getSiteById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import NewTermForm from './NewTermForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewTermPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  return <NewTermForm siteId={id} siteName={site.name} />;
}
