'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea, Select, Label, HelperText, FormCard, ErrorMessage, PrimaryButton } from '@/app/admin/components/FormComponents';
import Link from 'next/link';

interface Props {
  siteId: string;
  siteName: string;
}

export default function NewTermForm({ siteId, siteName }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/admin/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          type: formData.get('type'),
          name: formData.get('name'),
          slug: formData.get('slug'),
          description: formData.get('description') || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      router.push(`/admin/sites/${siteId}/terms`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Nouvelle taxonomie</h1>
        <p className="text-gray-400 mt-2">Créer une catégorie ou un tag pour {siteName}</p>
      </div>

      <FormCard>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div className="space-y-6">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select id="type" name="type" required defaultValue="category">
                <option value="category">Catégorie</option>
                <option value="tag">Tag</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Technologies, Actualités..."
                onBlur={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement;
                  if (slugInput && !slugInput.value) {
                    slugInput.value = generateSlug(e.target.value);
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                type="text"
                id="slug"
                name="slug"
                required
                placeholder="technologies"
                className="font-mono text-sm"
              />
              <HelperText>Généré automatiquement depuis le nom</HelperText>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Une courte description..."
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-700">
            <Link href={`/admin/sites/${siteId}/terms`} className="text-sm text-gray-400 hover:text-white">
              ← Annuler
            </Link>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer'}
            </PrimaryButton>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
