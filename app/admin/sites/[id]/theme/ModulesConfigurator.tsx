'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormCard, Label, Select, SuccessMessage, ErrorMessage, PrimaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  currentConfig: any;
  pageType: 'homepage' | 'category' | 'single';
  title?: string;
}

export default function ModulesConfigurator({ siteId, currentConfig, pageType, title }: Props) {
  const router = useRouter();
  
  const getDefaultConfig = () => {
    if (pageType === 'homepage') {
      return {
        layout: 'default',
        modules: [
          { type: 'hero', enabled: true, config: {} },
          { type: 'posts_grid', enabled: true, config: { columns: 2 } }
        ],
        sidebar: { enabled: false, position: 'right', modules: [] }
      };
    } else if (pageType === 'category') {
      return {
        layout: 'default',
        modules: [
          { type: 'posts_grid', enabled: true, config: { columns: 2 } }
        ],
        sidebar: { enabled: true, position: 'right', modules: [
          { type: 'categories', enabled: true, config: {} }
        ] }
      };
    } else { // single
      return {
        layout: 'default',
        sidebar: { enabled: true, position: 'right', modules: [
          { type: 'recent_posts', enabled: true, config: {} }
        ] }
      };
    }
  };
  
  const [config, setConfig] = useState(currentConfig?.[pageType] || getDefaultConfig());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_config: {
            modules_config: {
              ...currentConfig?.modules_config,
              [pageType]: config
            }
          }
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateLayout(layout: string) {
    setConfig({ ...config, layout });
  }

  function toggleSidebar() {
    setConfig({
      ...config,
      sidebar: {
        ...config.sidebar,
        enabled: !config.sidebar.enabled
      }
    });
  }

  function updateSidebarPosition(position: string) {
    setConfig({
      ...config,
      sidebar: { ...config.sidebar, position }
    });
  }

  function updateColumns(columns: number) {
    const modules = [...config.modules];
    const gridIndex = modules.findIndex(m => m.type === 'posts_grid');
    if (gridIndex >= 0) {
      modules[gridIndex] = {
        ...modules[gridIndex],
        config: { ...modules[gridIndex].config, columns }
      };
      setConfig({ ...config, modules });
    }
  }

  function toggleModule(type: string) {
    const modules = config.modules.map((m: any) => 
      m.type === type ? { ...m, enabled: !m.enabled } : m
    );
    setConfig({ ...config, modules });
  }

  function addSidebarModule(type: string) {
    if (!config.sidebar.modules.find((m: any) => m.type === type)) {
      setConfig({
        ...config,
        sidebar: {
          ...config.sidebar,
          modules: [...config.sidebar.modules, { type, enabled: true, config: {} }]
        }
      });
    }
  }

  function removeSidebarModule(type: string) {
    setConfig({
      ...config,
      sidebar: {
        ...config.sidebar,
        modules: config.sidebar.modules.filter((m: any) => m.type !== type)
      }
    });
  }

  const mainModules = config.modules || [];
  const gridModule = mainModules.find((m: any) => m.type === 'posts_grid');

  const showHeroModule = pageType === 'homepage';
  const showMainModules = pageType !== 'single';

  return (
    <FormCard>
      <h3 className="text-lg font-semibold text-white mb-4">
        {title || `Configuration des modules (${pageType})`}
      </h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Configuration sauvegardée !</SuccessMessage>}

      <div className="space-y-6">
        {/* Layout */}
        <div>
          <Label>Layout de la page</Label>
          <Select value={config.layout} onChange={(e) => updateLayout(e.target.value)}>
            <option value="default">Standard</option>
            <option value="centered">Centré</option>
            <option value="with_sidebar">Avec sidebar</option>
            <option value="full_width">Pleine largeur</option>
          </Select>
        </div>

        {/* Modules principaux */}
        {showMainModules && (
          <div>
            <Label>Modules principaux</Label>
            <div className="space-y-2">
              {mainModules.map((module: any) => (
                <div key={module.type} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={() => toggleModule(module.type)}
                      className="w-4 h-4"
                    />
                    <span className="text-white">
                      {module.type === 'hero' && '📣 Hero'}
                      {module.type === 'posts_grid' && '📰 Grille d\'articles'}
                      {module.type === 'posts_list' && '📝 Liste d\'articles'}
                    </span>
                  </div>
                  
                  {module.type === 'posts_grid' && module.enabled && (
                    <Select 
                      value={module.config?.columns || 2} 
                      onChange={(e) => updateColumns(Number(e.target.value))}
                      className="w-32"
                    >
                      <option value="1">1 colonne</option>
                      <option value="2">2 colonnes</option>
                      <option value="3">3 colonnes</option>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Sidebar</Label>
            <button
              type="button"
              onClick={toggleSidebar}
              className={`px-3 py-1 rounded text-sm ${
                config.sidebar.enabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {config.sidebar.enabled ? 'Activée' : 'Désactivée'}
            </button>
          </div>

          {config.sidebar.enabled && (
            <div className="space-y-3">
              <Select 
                value={config.sidebar.position} 
                onChange={(e) => updateSidebarPosition(e.target.value)}
              >
                <option value="right">À droite</option>
                <option value="left">À gauche</option>
              </Select>

              <div>
                <p className="text-sm text-gray-400 mb-2">Modules de la sidebar :</p>
                <div className="space-y-2">
                  {config.sidebar.modules.map((module: any) => (
                    <div key={module.type} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <span className="text-white text-sm">
                        {module.type === 'recent_posts' && '🕐 Articles récents'}
                        {module.type === 'categories' && '📁 Catégories'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSidebarModule(module.type)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  {!config.sidebar.modules.find((m: any) => m.type === 'recent_posts') && (
                    <button
                      type="button"
                      onClick={() => addSidebarModule('recent_posts')}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                    >
                      + Articles récents
                    </button>
                  )}
                  {!config.sidebar.modules.find((m: any) => m.type === 'categories') && (
                    <button
                      type="button"
                      onClick={() => addSidebarModule('categories')}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                    >
                      + Catégories
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <PrimaryButton type="button" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </PrimaryButton>
      </div>
    </FormCard>
  );
}
