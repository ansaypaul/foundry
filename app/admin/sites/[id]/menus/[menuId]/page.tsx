import { getSiteById } from '@/lib/db/queries';
import { getMenuById } from '@/lib/db/menus-queries';
import { notFound } from 'next/navigation';
import ImprovedMenuForm from '../new/ImprovedMenuForm';

interface PageProps {
  params: Promise<{ id: string; menuId: string }>;
}

export default async function EditMenuPage({ params }: PageProps) {
  const { id, menuId } = await params;
  const [site, menu] = await Promise.all([
    getSiteById(id),
    getMenuById(menuId),
  ]);

  if (!site || !menu) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Modifier le menu</h1>
        <p className="text-gray-400 mt-2">Éditer {menu.name}</p>
      </div>

      <ImprovedMenuForm siteId={id} menu={menu} />
    </div>
  );
}
