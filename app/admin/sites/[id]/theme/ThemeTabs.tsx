'use client';

import { useState } from 'react';
import ThemeSelector from './ThemeSelector';
import ModulesConfigurator from './ModulesConfigurator';

interface Props {
  siteId: string;
  currentThemeId: string | null;
  currentConfig: any;
  availableThemes: any[];
}

type TabId = 'visual' | 'homepage' | 'category' | 'single';

export default function ThemeTabs({ siteId, currentThemeId, currentConfig, availableThemes }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('visual');

  const tabs = [
    { id: 'visual' as TabId, label: 'Thème visuel', icon: '🎨' },
    { id: 'homepage' as TabId, label: 'Homepage', icon: '🏠' },
    { id: 'category' as TabId, label: 'Catégories', icon: '📁' },
    { id: 'single' as TabId, label: 'Article', icon: '📄' },
  ];

  return (
    <div>
      {/* Tabs navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'visual' && (
          <ThemeSelector
            siteId={siteId}
            currentThemeId={currentThemeId}
            availableThemes={availableThemes}
          />
        )}

        {activeTab === 'homepage' && (
          <ModulesConfigurator
            siteId={siteId}
            currentConfig={currentConfig}
            pageType="homepage"
            title="Configuration de la Homepage"
          />
        )}

        {activeTab === 'category' && (
          <ModulesConfigurator
            siteId={siteId}
            currentConfig={currentConfig}
            pageType="category"
            title="Configuration des pages Catégories"
          />
        )}

        {activeTab === 'single' && (
          <ModulesConfigurator
            siteId={siteId}
            currentConfig={currentConfig}
            pageType="single"
            title="Configuration des pages Article"
          />
        )}
      </div>
    </div>
  );
}
