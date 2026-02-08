'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Select, Label, FormCard, ErrorMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  sites: any[];
  menu?: any;
}

interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'custom' | 'page' | 'category';
}

export default function MenuForm({ sites, menu }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [siteId, setSiteId] = useState(menu?.site_id || '');
  const [name, setName] = useState(menu?.name || '');
  const [location, setLocation] = useState(menu?.location || 'header');
  const [items, setItems] = useState<MenuItem[]>(
    menu?.items ? JSON.parse(menu.items) : []
  );
  
  const [newItem, setNewItem] = useState({ label: '', url: '', type: 'custom' as const });

  function addItem() {
    if (!newItem.label || !newItem.url) return;
    
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        ...newItem,
      },
    ]);
    
    setNewItem({ label: '', url: '', type: 'custom' });
  }

  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = menu ? `/api/admin/menus/${menu.id}` : '/api/admin/menus';
      const method = menu ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          name,
          location,
          items: JSON.stringify(items),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      const returnTo = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('returnTo') 
        : null;
      
      router.push(returnTo || '/admin/menus');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  const returnUrl = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('returnTo') || '/admin/menus'
    : '/admin/menus';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Configuration du menu */}
      <FormCard>
        <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="site_id">Site *</Label>
            <Select
              id="site_id"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              required
              disabled={!!menu}
            >
              <option value="">Sélectionnez un site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Nom du menu *</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Menu principal"
            />
          </div>

          <div>
            <Label htmlFor="location">Emplacement *</Label>
            <Select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="header">En-tête</option>
              <option value="footer">Pied de page</option>
              <option value="sidebar">Barre latérale</option>
            </Select>
          </div>
        </div>
      </FormCard>

      {/* Items du menu */}
      <FormCard>
        <h3 className="text-lg font-semibold text-white mb-4">Éléments du menu</h3>
        
        {/* Liste des items */}
        {items.length > 0 && (
          <div className="mb-6 space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-gray-400 font-mono">{item.url}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <SecondaryButton
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs"
                  >
                    ↑
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="px-2 py-1 text-xs"
                  >
                    ↓
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                  >
                    Supprimer
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ajout d'item */}
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <div>
            <Label htmlFor="new-label">Libellé</Label>
            <Input
              type="text"
              id="new-label"
              value={newItem.label}
              onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
              placeholder="Accueil"
            />
          </div>

          <div>
            <Label htmlFor="new-url">URL</Label>
            <Input
              type="text"
              id="new-url"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              placeholder="/"
              className="font-mono text-sm"
            />
          </div>

          <SecondaryButton
            type="button"
            onClick={addItem}
            disabled={!newItem.label || !newItem.url}
          >
            + Ajouter l'élément
          </SecondaryButton>
        </div>
      </FormCard>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href={returnUrl} className="text-sm text-gray-400 hover:text-white">
          ← Annuler
        </Link>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : menu ? 'Mettre à jour' : 'Créer'}
        </PrimaryButton>
      </div>
    </form>
  );
}
