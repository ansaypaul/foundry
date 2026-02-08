import { getAllSites } from '@/lib/db/queries';
import MenuForm from './MenuForm';

export default async function NewMenuPage() {
  const sites = await getAllSites();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Créer un menu</h2>
        <p className="text-gray-400 mt-2">
          Ajoutez un nouveau menu de navigation
        </p>
      </div>

      <MenuForm sites={sites || []} />
    </div>
  );
}

