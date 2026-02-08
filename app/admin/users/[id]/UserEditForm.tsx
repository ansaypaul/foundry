'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Select, Label, FormCard, ErrorMessage, SuccessMessage, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Props {
  user: any;
  allSites: any[];
}

export default function UserEditForm({ user, allSites }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memberships
  const [memberships, setMemberships] = useState(user.memberships || []);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'author'>('author');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = { name, email };
      if (password) payload.password = password;

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de mise à jour');
      }

      setSuccess(true);
      if (password) setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddMembership() {
    if (!selectedSite) return;

    setError(null);
    try {
      const response = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          site_id: selectedSite,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur');
      }

      // Rafraîchir la page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function handleRemoveMembership(membershipId: string) {
    if (!confirm('Retirer cet accès ?')) return;

    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur de suppression');

      router.refresh();
    } catch (err) {
      setError('Impossible de retirer l\'accès');
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur de suppression');

      router.push('/admin/users');
    } catch (err) {
      setError('Impossible de supprimer l\'utilisateur');
    }
  }

  // Sites disponibles (pas encore assignés)
  const availableSites = allSites.filter(
    site => !memberships.some((m: any) => m.site_id === site.id)
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block">
            ← Retour aux utilisateurs
          </Link>
          <h1 className="text-2xl font-bold text-white">Modifier l'utilisateur</h1>
        </div>
        <SecondaryButton
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300"
        >
          Supprimer
        </SecondaryButton>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Utilisateur mis à jour !</SuccessMessage>}

      <div className="grid gap-6">
        {/* Informations de base */}
        <form onSubmit={handleSubmit}>
          <FormCard title="Informations">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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
                />
              </div>

              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  minLength={8}
                />
              </div>
            </div>

            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-6">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </PrimaryButton>
          </FormCard>
        </form>

        {/* Accès aux sites */}
        <FormCard title="Accès aux sites">
          <div className="space-y-4">
            {/* Liste des accès actuels */}
            {memberships.length > 0 ? (
              <div className="space-y-2">
                {memberships.map((membership: any) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {membership.sites?.name}
                      </p>
                      <p className="text-sm text-gray-400 capitalize">
                        {membership.role}
                      </p>
                    </div>
                    <SecondaryButton
                      onClick={() => handleRemoveMembership(membership.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Retirer
                    </SecondaryButton>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Aucun accès à un site</p>
            )}

            {/* Ajouter un accès */}
            {availableSites.length > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <Label>Ajouter un accès</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    <option value="">Choisir un site...</option>
                    {availableSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                  >
                    <option value="author">Auteur</option>
                    <option value="editor">Éditeur</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <SecondaryButton
                  onClick={handleAddMembership}
                  disabled={!selectedSite}
                  className="w-full mt-3"
                >
                  + Ajouter l'accès
                </SecondaryButton>
              </div>
            )}
          </div>
        </FormCard>
      </div>
    </div>
  );
}
