'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton } from '@/app/admin/components/FormComponents';

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      const { user } = await response.json();
      router.push(`/admin/users/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
          ← Retour aux utilisateurs
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouvel utilisateur</h1>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        <FormCard>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jean@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
            </div>
          </div>
        </FormCard>

        <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-6">
          {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
        </PrimaryButton>
      </form>
    </div>
  );
}
