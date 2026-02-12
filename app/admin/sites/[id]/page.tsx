import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { computeSiteDecisionProfile } from '@/lib/core/decisionEngine/siteDecisionEngine';
import EnrichmentOneClickButton from './EnrichmentOneClickButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteDashboard({ params }: PageProps) {
  const { id } = await params;
  const site = await getSiteById(id);

  if (!site) {
    notFound();
  }

  const supabase = getSupabaseAdmin();

  // Stats du site + check blueprint existence
  const [contentResult, domainsResult, blueprintResult, authorsResult, categoriesResult] = await Promise.all([
    supabase
      .from('content')
      .select('id, type, status')
      .eq('site_id', id),
    supabase
      .from('domains')
      .select('*')
      .eq('site_id', id),
    supabase
      .from('site_blueprint')
      .select('id, version')
      .eq('site_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('authors')
      .select('id')
      .eq('site_id', id),
    supabase
      .from('terms')
      .select('id')
      .eq('site_id', id)
      .eq('type', 'category'),
  ]);

  const content = contentResult.data || [];
  const domains = domainsResult.data || [];
  const hasBlueprint = !!blueprintResult.data;
  const authorsCount = authorsResult.data?.length || 0;
  const categoriesCount = categoriesResult.data?.length || 0;

  const stats = {
    totalArticles: content.filter(c => c.type === 'post').length,
    totalPages: content.filter(c => c.type === 'page').length,
    published: content.filter(c => c.status === 'published').length,
    drafts: content.filter(c => c.status === 'draft').length,
    domains: domains.length,
  };

  // Compute decision profile
  const decisionProfile = computeSiteDecisionProfile({
    siteType: site.site_type,
    automationLevel: site.automation_level,
    ambitionLevel: site.ambition_level,
    description: site.description,
    language: site.language,
    country: site.country,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 mt-2">Aperçu de {site.name}</p>
      </div>

      {/* Onboarding: Step 1 - Draft (Blueprint needed) */}
      {/* Show if: status is 'draft' OR status is 'blueprint_applied' but no actual blueprint/entities exist */}
      {(site.setup_status === 'draft' || 
        (site.setup_status === 'blueprint_applied' && (!hasBlueprint || (authorsCount === 0 && categoriesCount === 0)))) && (
        <div className="mb-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">🚀</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Étape 1 : Générer la structure
                </h3>
                <span className="px-2 py-1 text-xs bg-purple-600/50 text-purple-200 rounded">
                  IA
                </span>
              </div>
              <p className="text-gray-300 mb-4">
                Générez automatiquement la structure de votre site (catégories, auteurs, pages, types de contenu) 
                adaptée à votre niche en utilisant l'IA.
              </p>
              {site.setup_status === 'blueprint_applied' && (!hasBlueprint || (authorsCount === 0 && categoriesCount === 0)) && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    ⚠️ Le statut du site indique "blueprint appliqué" mais aucune structure n'a été trouvée. 
                    Veuillez générer un blueprint pour continuer.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Link
                  href={`/admin/sites/${id}/setup`}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <span>🤖</span>
                  <span>Générer avec l'IA</span>
                </Link>
                <Link
                  href={`/admin/sites/${id}/settings`}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Paramètres du site
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: Step 2 - Blueprint Applied (Enrichment needed) */}
      {/* Show only if blueprint exists AND entities are created */}
      {site.setup_status === 'blueprint_applied' && hasBlueprint && (authorsCount > 0 || categoriesCount > 0) && (
        <div className="mb-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">✨</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Étape 2 : Enrichir le contenu
                </h3>
                <span className="px-2 py-1 text-xs bg-green-600/50 text-green-200 rounded">
                  1 clic
                </span>
              </div>
              <p className="text-gray-300 mb-4">
                La structure est créée ! Maintenant, générez automatiquement le contenu : 
                descriptions de catégories, biographies d'auteurs, et pages essentielles.
              </p>
              <EnrichmentOneClickButton siteId={id} />
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: Step 3 - Enriched (Site ready) */}
      {site.setup_status === 'enriched' && (
        <div className="mb-8 bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">✅</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Site prêt à l'emploi !
              </h3>
              <p className="text-gray-300 mb-4">
                La structure et le contenu sont générés. Votre site est prêt pour la publication d'articles.
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/admin/sites/${id}/articles/new-ai`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Créer un article IA
                </Link>
                <Link
                  href={`/admin/sites/${id}/ai-jobs`}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Voir les jobs IA
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Profile */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Profil du site (Decision Engine)</h2>
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Taille</div>
            <div className="text-2xl font-bold text-white capitalize">{decisionProfile.siteSize}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Complexité</div>
            <div className="text-2xl font-bold text-white">{decisionProfile.complexity}/3</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Vélocité</div>
            <div className="text-2xl font-bold text-white capitalize">{decisionProfile.velocity}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">Objectifs (targets)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Auteurs</div>
              <div className="text-white font-medium">{decisionProfile.targets.authors.min}–{decisionProfile.targets.authors.max}</div>
            </div>
            <div>
              <div className="text-gray-400">Catégories</div>
              <div className="text-white font-medium">{decisionProfile.targets.categories.min}–{decisionProfile.targets.categories.max}</div>
            </div>
            <div>
              <div className="text-gray-400">Types de contenu</div>
              <div className="text-white font-medium">{decisionProfile.targets.contentTypes.min}–{decisionProfile.targets.contentTypes.max}</div>
            </div>
            <div>
              <div className="text-gray-400">Pages obligatoires</div>
              <div className="text-white font-medium">{decisionProfile.targets.mandatoryPages.min}–{decisionProfile.targets.mandatoryPages.max}</div>
            </div>
          </div>
        </div>

        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-300">Rationale (debug)</summary>
          <ul className="mt-2 space-y-1 pl-4">
            {decisionProfile.rationale.map((line, i) => (
              <li key={i} className="list-disc">{line}</li>
            ))}
          </ul>
        </details>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Articles</div>
          <div className="text-3xl font-bold text-white">{stats.totalArticles}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Pages</div>
          <div className="text-3xl font-bold text-white">{stats.totalPages}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-1">Publiés</div>
          <div className="text-3xl font-bold text-white">{stats.published}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href={`/admin/sites/${id}/articles/new-ai`}
            className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/20 group-hover:to-purple-400/20 transition-all" />
            <div className="relative">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-sm text-white font-semibold">Article IA</div>
            </div>
          </Link>
          <Link
            href={`/admin/sites/${id}/articles/new`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm text-white">Article manuel</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/content/new?type=page`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm text-white">Nouvelle page</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/media`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm text-white">Upload média</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/menus`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🧭</div>
            <div className="text-sm text-white">Gérer menus</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/blueprint`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm text-white">Blueprint</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/ai-jobs`}
            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm text-white">Jobs IA</div>
          </Link>
          <Link
            href={`/admin/sites/${id}/enhance`}
            className="p-4 bg-gradient-to-br from-purple-700 to-blue-700 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors text-center"
          >
            <div className="text-2xl mb-2">✨</div>
            <div className="text-sm text-white font-medium">Enrichissement IA</div>
          </Link>
        </div>
      </div>

      {/* Domaines */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Domaines ({domains.length})</h2>
        {domains.length === 0 ? (
          <p className="text-gray-400">Aucun domaine configuré</p>
        ) : (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div>
                  <span className="text-white">{domain.hostname}</span>
                  {domain.is_primary && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">Principal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href={`/admin/sites/${id}/settings`}
          className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          Gérer les domaines →
        </Link>
      </div>
    </div>
  );
}
