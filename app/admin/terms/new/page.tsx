'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Textarea, Select, Label, HelperText, FormCard, ErrorMessage, PrimaryButton } from '@/app/admin/components/FormComponents';

function NewTermForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch('/api/admin/sites')
      .then(res => res.json())
      .then(data => {
        setSites(data.sites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  });

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
          site_id: formData.get('site_id'),
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

      const returnTo = searchParams.get('returnTo');
      router.push(returnTo || '/admin/terms');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  const returnUrl = searchParams.get('returnTo') || '/admin/terms';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Nouvelle taxonomie</h1>
        <p className="mt-2 text-gray-400">Créer une catégorie ou un tag</p>
      </div>

      <FormCard>
        <form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div className="space-y-6">
            <div>
              <Label htmlFor="site_id">Site *</Label>
              <Select id="site_id" name="site_id" required>
                <option value="">Sélectionner un site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                id="type"
                name="type"
                required
                defaultValue={searchParams.get('type') || 'category'}
              >
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
            <Link href={returnUrl} className="text-sm text-gray-400 hover:text-white">
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

export default function NewTermPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Chargement...</div>}>
      <NewTermForm />
    </Suspense>
  );
}
