'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  site: any;
}

export default function SiteEditForm({ site }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/admin/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          theme_key: formData.get('theme_key'),
          status: formData.get('status'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard>
      <h3 className="text-lg font-semibold text-white mb-6">Informations du site</h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Site mis à jour avec succès !</SuccessMessage>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nom du site *</Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={site.name}
          />
        </div>

        <div>
          <Label htmlFor="theme_key">Thème</Label>
          <Input
            type="text"
            id="theme_key"
            name="theme_key"
            defaultValue={site.theme_key}
          />
        </div>

        <div>
          <Label htmlFor="status">Statut</Label>
          <Select id="status" name="status" defaultValue={site.status}>
            <option value="active">Actif</option>
            <option value="maintenance">Maintenance</option>
            <option value="disabled">Désactivé</option>
          </Select>
        </div>

        <div className="pt-6 border-t border-gray-700">
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </PrimaryButton>
        </div>
      </form>
    </FormCard>
  );
}
