'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Domain } from '@/lib/db/types';
import { Input, FormCard, ErrorMessage, PrimaryButton, SecondaryButton, HelperText } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  initialDomains: Domain[];
}

export default function DomainsManager({ siteId, initialDomains }: Props) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [isAdding, setIsAdding] = useState(false);
  const [newHostname, setNewHostname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null);

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newHostname.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          hostname: newHostname.trim().toLowerCase(),
          is_primary: domains.length === 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout du domaine');
      }

      const { domain } = await response.json();
      setDomains([...domains, domain]);
      setNewHostname('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleSetPrimary(domainId: string) {
    setLoadingDomain(domainId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/domains/${domainId}/set-primary`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingDomain(null);
    }
  }

  async function handleDelete(domainId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce domaine ?')) {
      return;
    }

    setLoadingDomain(domainId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setDomains(domains.filter(d => d.id !== domainId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingDomain(null);
    }
  }

  return (
    <FormCard>
      <h3 className="text-lg font-semibold text-white mb-6">Domaines</h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Liste des domaines */}
      {domains.length > 0 ? (
        <div className="mb-6 space-y-2">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm text-white">{domain.hostname}</span>
                {domain.is_primary && (
                  <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                    Principal
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {!domain.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(domain.id)}
                    disabled={loadingDomain === domain.id}
                    className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    Définir comme principal
                  </button>
                )}
                <button
                  onClick={() => handleDelete(domain.id)}
                  disabled={loadingDomain === domain.id || domain.is_primary}
                  className="px-3 py-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  title={domain.is_primary ? 'Impossible de supprimer le domaine principal' : 'Supprimer'}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg text-center text-gray-400 text-sm">
          Aucun domaine configuré. Ajoutez-en un ci-dessous.
        </div>
      )}

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAddDomain} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newHostname}
            onChange={(e) => setNewHostname(e.target.value)}
            placeholder="monsite.localhost ou monsite.com"
            className="flex-1"
          />
          <PrimaryButton
            type="submit"
            disabled={isAdding || !newHostname.trim()}
          >
            {isAdding ? 'Ajout...' : 'Ajouter'}
          </PrimaryButton>
        </div>
        <HelperText>
          Utilisez des domaines en .localhost pour le développement (ex: monsite.localhost)
        </HelperText>
      </form>
    </FormCard>
  );
}
