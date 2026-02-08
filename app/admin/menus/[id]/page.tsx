import { getMenuById } from '@/lib/db/menus-queries';
import { getAllSites } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import MenuForm from '../new/MenuForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMenuPage({ params }: PageProps) {
  const { id } = await params;
  const [menu, sites] = await Promise.all([
    getMenuById(id),
    getAllSites(),
  ]);

  if (!menu) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Modifier le menu</h2>
        <p className="text-gray-400 mt-2">{menu.name}</p>
      </div>

      <MenuForm sites={sites || []} menu={menu} />
    </div>
  );
}
