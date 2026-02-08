/**
 * Domain Orchestrator - Logique métier pour le Push Domain
 * 
 * Gère la state machine complète:
 * draft → pushing → waiting_nameservers → dns_configured → vercel_pending → live
 * 
 * Idempotent: peut être relancé à tout moment sans casser l'état existant
 */

import { getSupabaseAdmin } from './db/client';
import { validateDomainPushEnv } from './env';
import * as cloudflare from './providers/cloudflare';
import * as vercel from './providers/vercel';

// Types pour la state machine
export type DomainStatus = 
  | 'draft'
  | 'pushing'
  | 'waiting_nameservers'
  | 'dns_configured'
  | 'vercel_pending'
  | 'live'
  | 'error';

interface Domain {
  id: string;
  site_id: string;
  hostname: string;
  cloudflare_zone_id: string | null;
  vercel_project_id: string | null;
  domain_status: DomainStatus;
  last_step: string | null;
  last_error: string | null;
  nameservers: string[] | null;
  push_started_at: string | null;
  push_completed_at: string | null;
}

interface PushResult {
  success: boolean;
  status: DomainStatus;
  message: string;
  needsAction?: {
    type: 'configure_nameservers';
    nameservers: string[];
  };
}

/**
 * Met à jour le statut d'un domaine dans la DB
 */
async function updateDomainStatus(
  domainId: string,
  updates: {
    domain_status?: DomainStatus;
    last_step?: string;
    last_error?: string | null;
    cloudflare_zone_id?: string;
    vercel_project_id?: string;
    nameservers?: string[];
    push_started_at?: string;
    push_completed_at?: string;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('domains')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (error) {
    console.error('[Orchestrator] Erreur mise à jour domaine:', error);
    throw new Error(`Erreur DB: ${error.message}`);
  }

  console.log(`[Orchestrator] Domaine ${domainId} mis à jour:`, updates);
}

/**
 * Récupère un domaine par ID
 */
async function getDomain(domainId: string): Promise<Domain | null> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error) {
    console.error('[Orchestrator] Erreur récupération domaine:', error);
    throw new Error(`Erreur DB: ${error.message}`);
  }

  return data as Domain;
}

/**
 * ÉTAPE 1: Créer ou récupérer la zone Cloudflare
 */
async function stepCloudflareZone(domain: Domain): Promise<{
  zoneId: string;
  needsNSUpdate: boolean;
  nameservers: string[];
}> {
  console.log(`[Orchestrator] Étape 1: Zone Cloudflare pour ${domain.hostname}`);
  
  await updateDomainStatus(domain.id, {
    last_step: 'cloudflare_zone',
    last_error: null,
  });

  // Cas 1: zone_id déjà enregistré → vérifier qu'elle existe toujours
  if (domain.cloudflare_zone_id) {
    try {
      const isActive = await cloudflare.isZoneActive(domain.cloudflare_zone_id);
      const nameservers = await cloudflare.getZoneNameservers(domain.cloudflare_zone_id);
      
      console.log(`[Orchestrator] Zone existante ${domain.cloudflare_zone_id} (active: ${isActive})`);
      
      return {
        zoneId: domain.cloudflare_zone_id,
        needsNSUpdate: !isActive,
        nameservers,
      };
    } catch (error) {
      console.warn('[Orchestrator] Zone ID invalide, recherche de la zone...');
    }
  }

  // Cas 2: chercher si la zone existe déjà sur Cloudflare
  const existingZone = await cloudflare.getZoneByName(domain.hostname);
  
  if (existingZone) {
    console.log(`[Orchestrator] Zone trouvée: ${existingZone.id}`);
    
    await updateDomainStatus(domain.id, {
      cloudflare_zone_id: existingZone.id,
      nameservers: existingZone.name_servers,
    });

    return {
      zoneId: existingZone.id,
      needsNSUpdate: existingZone.status !== 'active',
      nameservers: existingZone.name_servers,
    };
  }

  // Cas 3: créer la zone
  console.log(`[Orchestrator] Création de la zone pour ${domain.hostname}`);
  
  const { zoneId, nameservers, status } = await cloudflare.createZone(domain.hostname);

  await updateDomainStatus(domain.id, {
    cloudflare_zone_id: zoneId,
    nameservers,
  });

  return {
    zoneId,
    needsNSUpdate: status !== 'active',
    nameservers,
  };
}

/**
 * ÉTAPE 2: Configurer les DNS pour Vercel
 */
async function stepConfigureDNS(domain: Domain, zoneId: string): Promise<void> {
  console.log(`[Orchestrator] Étape 2: Configuration DNS pour ${domain.hostname}`);
  
  await updateDomainStatus(domain.id, {
    last_step: 'dns_configuration',
    last_error: null,
  });

  // Créer les CNAME records pour Vercel
  await cloudflare.createVercelDNSRecords(zoneId, domain.hostname);

  console.log(`[Orchestrator] DNS configurés pour ${domain.hostname}`);
}

/**
 * ÉTAPE 3: Ajouter le domaine à Vercel
 */
async function stepAddToVercel(domain: Domain, vercelProjectId: string): Promise<void> {
  console.log(`[Orchestrator] Étape 3: Ajout à Vercel pour ${domain.hostname}`);
  
  await updateDomainStatus(domain.id, {
    last_step: 'vercel_add_domain',
    last_error: null,
  });

  // Ajouter apex et www
  await vercel.addDomainWithWWW(vercelProjectId, domain.hostname);

  console.log(`[Orchestrator] Domaines ajoutés à Vercel pour ${domain.hostname}`);
}

/**
 * ÉTAPE 4: Vérifier la validation Vercel
 */
async function stepCheckVercelValidation(domain: Domain, vercelProjectId: string): Promise<boolean> {
  console.log(`[Orchestrator] Étape 4: Vérification validation Vercel pour ${domain.hostname}`);
  
  await updateDomainStatus(domain.id, {
    last_step: 'vercel_validation_check',
    last_error: null,
  });

  const validation = await vercel.checkDomainValidation(
    vercelProjectId,
    domain.hostname
  );

  console.log(`[Orchestrator] Validation Vercel:`, validation);

  return validation.allVerified;
}

/**
 * Orchestrateur principal - Push Domain
 * 
 * Reprend depuis le statut actuel (idempotent)
 */
export async function pushDomain(domainId: string): Promise<PushResult> {
  try {
    // Valider la config
    validateDomainPushEnv();

    // Récupérer le domaine
    const domain = await getDomain(domainId);
    if (!domain) {
      throw new Error(`Domaine ${domainId} introuvable`);
    }

    // Utiliser le vercel_project_id depuis la DB OU depuis l'env (fallback)
    const vercelProjectId = domain.vercel_project_id || process.env.VERCEL_PROJECT_ID;
    
    if (!vercelProjectId) {
      throw new Error('vercel_project_id manquant (ni en DB ni dans VERCEL_PROJECT_ID)');
    }

    console.log(`[Orchestrator] Push domain démarré pour ${domain.hostname} (status: ${domain.domain_status})`);

    // Marquer comme "pushing" si c'est un nouveau push
    if (domain.domain_status === 'draft' || domain.domain_status === 'error') {
      await updateDomainStatus(domainId, {
        domain_status: 'pushing',
        push_started_at: new Date().toISOString(),
        last_error: null,
      });
      // Recharger le domaine
      const updatedDomain = await getDomain(domainId);
      if (updatedDomain) {
        Object.assign(domain, updatedDomain);
      }
    }

    // ÉTAPE 1: Zone Cloudflare
    if (!domain.cloudflare_zone_id || domain.domain_status === 'pushing') {
      const { zoneId, needsNSUpdate, nameservers } = await stepCloudflareZone(domain);
      domain.cloudflare_zone_id = zoneId;
      domain.nameservers = nameservers;

      if (needsNSUpdate) {
        await updateDomainStatus(domainId, {
          domain_status: 'waiting_nameservers',
          nameservers,
        });

        return {
          success: true,
          status: 'waiting_nameservers',
          message: 'Zone Cloudflare créée. Configurez les nameservers chez votre registrar.',
          needsAction: {
            type: 'configure_nameservers',
            nameservers,
          },
        };
      }
    }

    // ÉTAPE 2: DNS Configuration
    if (domain.domain_status === 'waiting_nameservers' || domain.domain_status === 'pushing') {
      // Vérifier que la zone est active
      if (domain.cloudflare_zone_id) {
        const isActive = await cloudflare.isZoneActive(domain.cloudflare_zone_id);
        if (!isActive) {
          return {
            success: true,
            status: 'waiting_nameservers',
            message: 'En attente de la propagation des nameservers.',
            needsAction: {
              type: 'configure_nameservers',
              nameservers: domain.nameservers || [],
            },
          };
        }
      }

      await stepConfigureDNS(domain, domain.cloudflare_zone_id!);
      
      await updateDomainStatus(domainId, {
        domain_status: 'dns_configured',
      });
    }

    // Recharger le domaine après mise à jour du statut
    const updatedDomain = await getDomain(domainId);
    if (updatedDomain) {
      Object.assign(domain, updatedDomain);
    }

    // ÉTAPE 3: Ajout à Vercel (utiliser le vercelProjectId résolu)
    if (domain.domain_status === 'dns_configured') {
      await stepAddToVercel(domain, vercelProjectId);
      
      await updateDomainStatus(domainId, {
        domain_status: 'vercel_pending',
      });

      return {
        success: true,
        status: 'vercel_pending',
        message: 'Domaine ajouté à Vercel. Vérification en cours...',
      };
    }

    // ÉTAPE 4: Vérification Vercel (utiliser le vercelProjectId résolu)
    if (domain.domain_status === 'vercel_pending') {
      const isVerified = await stepCheckVercelValidation(domain, vercelProjectId);

      if (isVerified) {
        await updateDomainStatus(domainId, {
          domain_status: 'live',
          push_completed_at: new Date().toISOString(),
        });

        return {
          success: true,
          status: 'live',
          message: 'Domaine configuré et validé avec succès !',
        };
      }

      return {
        success: true,
        status: 'vercel_pending',
        message: 'En attente de la validation Vercel (propagation DNS en cours).',
      };
    }

    // Cas déjà live
    if (domain.domain_status === 'live') {
      return {
        success: true,
        status: 'live',
        message: 'Domaine déjà configuré et actif.',
      };
    }

    throw new Error(`État non géré: ${domain.domain_status}`);

  } catch (error) {
    console.error('[Orchestrator] Erreur push domain:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    await updateDomainStatus(domainId, {
      domain_status: 'error',
      last_error: errorMessage,
    });

    return {
      success: false,
      status: 'error',
      message: `Erreur: ${errorMessage}`,
    };
  }
}

/**
 * Récupère le statut actuel d'un domaine (pour l'UI)
 */
export async function getDomainPushStatus(domainId: string): Promise<{
  status: DomainStatus;
  lastStep: string | null;
  lastError: string | null;
  nameservers: string[] | null;
  canRetry: boolean;
  canCheckStatus: boolean;
}> {
  const domain = await getDomain(domainId);
  
  if (!domain) {
    throw new Error(`Domaine ${domainId} introuvable`);
  }

  return {
    status: domain.domain_status,
    lastStep: domain.last_step,
    lastError: domain.last_error,
    nameservers: domain.nameservers,
    canRetry: domain.domain_status === 'error',
    canCheckStatus: ['waiting_nameservers', 'vercel_pending'].includes(domain.domain_status),
  };
}
