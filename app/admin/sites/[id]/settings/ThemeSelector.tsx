'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select, Label, FormCard, SuccessMessage, ErrorMessage, PrimaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  currentThemeId: string | null;
  availableThemes: any[];
}

export default function ThemeSelector({ siteId, currentThemeId, availableThemes }: Props) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTheme = availableThemes.find(t => t.id === selectedTheme);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_id: selectedTheme,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard>
      <h3 className="text-lg font-semibold text-white mb-4">Thème visuel</h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Thème mis à jour !</SuccessMessage>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="theme">Sélectionner un thème</Label>
          <Select
            id="theme"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
          >
            <option value="">Aucun thème</option>
            {availableThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Preview du thème */}
        {currentTheme && (
          <div className="p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">{currentTheme.name}</h4>
            <p className="text-gray-300 text-sm mb-4">{currentTheme.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Layout:</span>
                <span className="text-white text-sm">{currentTheme.layout_type}</span>
              </div>
              
              <div>
                <span className="text-gray-400 text-sm block mb-2">Couleurs:</span>
                <div className="flex gap-2">
                  {Object.entries(currentTheme.colors).map(([key, color]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div 
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 rounded border border-gray-600"
                      />
                      <span className="text-xs text-gray-400 mt-1 block">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <PrimaryButton type="submit" disabled={isSubmitting || !selectedTheme}>
          {isSubmitting ? 'Application...' : 'Appliquer le thème'}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}
