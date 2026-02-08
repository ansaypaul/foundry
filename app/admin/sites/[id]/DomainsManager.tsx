'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Domain } from '@/lib/db/types';
import { Input, FormCard, ErrorMessage, PrimaryButton, SecondaryButton, HelperText } from '@/app/admin/components/FormComponents';

interface Props {
  siteId: string;
  initialDomains: Domain[];
  vercelProjectId?: string;
}

type DomainStatus = 
  | 'draft'
  | 'pushing'
  | 'waiting_nameservers'
  | 'dns_configured'
  | 'vercel_pending'
  | 'live'
  | 'error';

interface DomainWithStatus extends Domain {
  domain_status?: DomainStatus;
  last_error?: string | null;
  nameservers?: string[] | null;
}

export default function DomainsManager({ siteId, initialDomains, vercelProjectId }: Props) {
  const router = useRouter();
  const [domains, setDomains] = useState<DomainWithStatus[]>(initialDomains);
  const [isAdding, setIsAdding] = useState(false);
  const [newHostname, setNewHostname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingDomain, setLoadingDomain] = useState<string | null>(null);
  const [pushingDomain, setPushingDomain] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ domainId: string; message: string; type: 'success' | 'info' | 'error' } | null>(null);

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
          vercel_project_id: vercelProjectId,
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

  async function handlePushDomain(domainId: string) {
    setPushingDomain(domainId);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/admin/domains/${domainId}/push-domain`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du push domain');
      }

      // Afficher le message de statut
      setStatusMessage({
        domainId,
        message: data.message,
        type: data.status === 'error' ? 'error' : data.status === 'live' ? 'success' : 'info',
      });

      // Si nameservers à configurer, les afficher
      if (data.needsAction?.type === 'configure_nameservers') {
        const domain = domains.find(d => d.id === domainId);
        if (domain) {
          setDomains(domains.map(d => 
            d.id === domainId 
              ? { ...d, domain_status: data.status, nameservers: data.needsAction.nameservers }
              : d
          ));
        }
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setPushingDomain(null);
    }
  }

  async function handleCheckStatus(domainId: string) {
    setLoadingDomain(domainId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/domains/${domainId}/domain-status`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du statut');
      }

      // Mettre à jour le domaine avec le nouveau statut
      setDomains(domains.map(d => 
        d.id === domainId 
          ? { ...d, domain_status: data.status, last_error: data.lastError, nameservers: data.nameservers }
          : d
      ));

      // Si on peut continuer, relancer le push
      if (data.canCheckStatus) {
        await handlePushDomain(domainId);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingDomain(null);
    }
  }

  function getStatusBadge(status?: DomainStatus) {
    if (!status || status === 'draft') return null;

    const styles = {
      pushing: 'bg-yellow-600 text-white',
      waiting_nameservers: 'bg-orange-600 text-white',
      dns_configured: 'bg-blue-600 text-white',
      vercel_pending: 'bg-purple-600 text-white',
      live: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
    };

    const labels = {
      pushing: 'En cours...',
      waiting_nameservers: 'NS requis',
      dns_configured: 'DNS OK',
      vercel_pending: 'Validation...',
      live: 'Actif',
      error: 'Erreur',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  function canPushDomain(domain: DomainWithStatus): boolean {
    // Ne peut pas push localhost
    if (domain.hostname.includes('localhost')) return false;
    // Peut push si draft ou error
    return !domain.domain_status || domain.domain_status === 'draft' || domain.domain_status === 'error';
  }

  function canCheckStatus(domain: DomainWithStatus): boolean {
    return domain.domain_status === 'waiting_nameservers' || domain.domain_status === 'vercel_pending';
  }

  return (
    <FormCard>
      <h3 className="text-lg font-semibold text-white mb-6">Domaines</h3>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Message de statut */}
      {statusMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          statusMessage.type === 'error' ? 'bg-red-900/50 text-red-200' :
          statusMessage.type === 'success' ? 'bg-green-900/50 text-green-200' :
          'bg-blue-900/50 text-blue-200'
        }`}>
          {statusMessage.message}
        </div>
      )}

      {/* Liste des domaines */}
      {domains.length > 0 ? (
        <div className="mb-6 space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="p-4 bg-gray-700/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-white">{domain.hostname}</span>
                  {domain.is_primary && (
                    <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                      Principal
                    </span>
                  )}
                  {getStatusBadge(domain.domain_status)}
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

              {/* Boutons Push Domain */}
              {!domain.hostname.includes('localhost') && (
                <div className="flex items-center space-x-2">
                  {canPushDomain(domain) && (
                    <button
                      onClick={() => handlePushDomain(domain.id)}
                      disabled={pushingDomain === domain.id}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-50"
                      title="Lancer la configuration automatique Cloudflare + Vercel"
                    >
                      {pushingDomain === domain.id ? 'Push en cours...' : 'Push Domain'}
                    </button>
                  )}
                  
                  {canCheckStatus(domain) && (
                    <button
                      onClick={() => handleCheckStatus(domain.id)}
                      disabled={loadingDomain === domain.id}
                      className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                      {loadingDomain === domain.id ? 'Vérification...' : 'Vérifier / Continuer'}
                    </button>
                  )}

                  {domain.domain_status === 'error' && domain.last_error && (
                    <span className="text-xs text-red-400">
                      Erreur: {domain.last_error}
                    </span>
                  )}
                </div>
              )}

              {/* Affichage des nameservers si nécessaire */}
              {domain.domain_status === 'waiting_nameservers' && domain.nameservers && (
                <div className="p-3 bg-orange-900/30 rounded border border-orange-600/50">
                  <p className="text-sm text-orange-200 font-semibold mb-2">
                    Configurez ces nameservers chez votre registrar:
                  </p>
                  <ul className="space-y-1">
                    {domain.nameservers.map((ns, idx) => (
                      <li key={idx} className="text-sm font-mono text-orange-100">
                        {ns}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-orange-300 mt-2">
                    Puis cliquez sur "Vérifier / Continuer" pour poursuivre.
                  </p>
                </div>
              )}
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
