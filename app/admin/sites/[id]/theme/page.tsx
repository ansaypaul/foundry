import { getSiteById } from '@/lib/db/queries';
import { getAllThemes } from '@/lib/db/themes-queries';
import { notFound } from 'next/navigation';
import ThemeTabs from './ThemeTabs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteThemePage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const themes = await getAllThemes();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Thème</h1>
        <p className="text-gray-400 mt-2">Personnalisez l'apparence de {site.name}</p>
      </div>

      <ThemeTabs
        siteId={id}
        currentThemeId={(site as any).theme_id || null}
        currentConfig={(site as any).theme_config}
        availableThemes={themes}
      />
    </div>
  );
}
