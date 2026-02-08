'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Select, Label, FormCard, ErrorMessage, HelperText, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Theme {
  id: string;
  name: string;
  key: string;
}

export default function NewSitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [themeId, setThemeId] = useState<string>('');
  const [status, setStatus] = useState('active');
  const [themes, setThemes] = useState<Theme[]>([]);

  // Charger les thèmes
  useEffect(() => {
    async function loadThemes() {
      try {
        const response = await fetch('/api/admin/themes');
        if (response.ok) {
          const data = await response.json();
          setThemes(data.themes || []);
          // Sélectionner le premier thème par défaut
          if (data.themes && data.themes.length > 0) {
            setThemeId(data.themes[0].id);
          }
        }
      } catch (err) {
        console.error('Erreur chargement thèmes:', err);
      }
    }
    loadThemes();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          theme_id: themeId || null,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du site');
      }

      const { site } = await response.json();
      
      // Rediriger vers la page d'édition du site pour ajouter des domaines
      router.push(`/admin/sites/${site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/sites" 
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Retour aux sites
        </Link>
        <h2 className="text-3xl font-bold text-white mt-2">Créer un nouveau site</h2>
        <p className="text-gray-400 mt-2">
          Créez un nouveau site éditorial. Vous pourrez ajouter des domaines après la création.
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        <FormCard>
          <div className="space-y-6">
            {/* Nom du site */}
            <div>
              <Label htmlFor="name">Nom du site *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mon Super Site"
              />
              <HelperText>
                Le nom du site tel qu'il apparaîtra dans l'admin et sur le site public.
              </HelperText>
            </div>

            {/* Thème */}
            <div>
              <Label htmlFor="theme_id">Thème</Label>
              <Select
                id="theme_id"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
              >
                {themes.length === 0 ? (
                  <option value="">Chargement...</option>
                ) : (
                  themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))
                )}
              </Select>
              <HelperText>
                Le thème définit l'apparence visuelle du site.
              </HelperText>
            </div>

            {/* Statut */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
              </Select>
              <HelperText>
                Un site en pause ne sera pas accessible publiquement.
              </HelperText>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-700">
            <Link
              href="/admin/sites"
              className="text-sm text-gray-400 hover:text-white"
            >
              Annuler
            </Link>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le site'}
            </PrimaryButton>
          </div>
        </FormCard>
      </form>
    </div>
  );
}
