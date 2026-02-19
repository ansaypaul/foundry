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
          language: formData.get('language'),
          country: formData.get('country'),
          site_type: formData.get('site_type'),
          automation_level: formData.get('automation_level'),
          ambition_level: formData.get('ambition_level'),
          description: formData.get('description'),
          custom_head_code: formData.get('custom_head_code'),
          custom_footer_code: formData.get('custom_footer_code'),
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
            <option value="paused">En pause</option>
          </Select>
        </div>

        {/* Configuration du site */}
        <div className="pt-6 border-t border-gray-700">
          <h4 className="text-md font-semibold text-white mb-4">Configuration du site</h4>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="language">Langue du site</Label>
              <Select id="language" name="language" defaultValue={site.language || 'fr'}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="country">Pays cible</Label>
              <Select id="country" name="country" defaultValue={site.country || 'FR'}>
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
                <option value="GB">Royaume-Uni</option>
                <option value="DE">Allemagne</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
                <option value="NL">Pays-Bas</option>
                <option value="PT">Portugal</option>
                <option value="JP">Japon</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="site_type">Type de site</Label>
              <Select id="site_type" name="site_type" defaultValue={site.site_type || 'niche_passion'}>
                <option value="niche_passion">Niche / Passion</option>
                <option value="news_media">Actualités / Média</option>
                <option value="gaming_popculture">Gaming / Pop Culture</option>
                <option value="affiliate_guides">Guides / Affiliation</option>
                <option value="lifestyle">Lifestyle</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="automation_level">Niveau d'automatisation</Label>
              <Select id="automation_level" name="automation_level" defaultValue={site.automation_level || 'manual'}>
                <option value="manual">Manuel</option>
                <option value="ai_assisted">Assisté par IA</option>
                <option value="ai_auto">Automatique (IA)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="ambition_level">Niveau d'ambition</Label>
              <Select id="ambition_level" name="ambition_level" defaultValue={site.ambition_level || 'auto'}>
                <option value="auto">Auto (recommandé)</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="factory">Factory</option>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={site.description || ''}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Décrivez brièvement la niche et l'objectif du site..."
              />
            </div>

            <div className="col-span-2">
              <div className="text-sm text-gray-400">Statut de configuration</div>
              <div className="mt-1">
                {site.setup_status === 'draft' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-900/50 text-yellow-200 border border-yellow-500/50">
                    Brouillon
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-900/50 text-green-200 border border-green-500/50">
                    Configuré
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Code personnalisé (tracking, vérifications) */}
        <div className="pt-6 border-t border-gray-700">
          <h4 className="text-md font-semibold text-white mb-2">Code personnalisé</h4>
          <p className="text-sm text-gray-400 mb-4">
            Injectez du code HTML/JS personnalisé dans votre site (Google Analytics, vérifications de domaine, etc.)
          </p>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="custom_head_code">Code dans le &lt;head&gt;</Label>
              <textarea
                id="custom_head_code"
                name="custom_head_code"
                rows={8}
                defaultValue={site.custom_head_code || ''}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono text-sm"
                placeholder="<!-- Google Analytics, vérifications, etc. -->"
              />
              <p className="text-xs text-gray-500 mt-1">
                Code injecté dans le &lt;head&gt; (Google Search Console, Bing Webmaster, etc.)
              </p>
            </div>

            <div>
              <Label htmlFor="custom_footer_code">Code avant le &lt;/body&gt;</Label>
              <textarea
                id="custom_footer_code"
                name="custom_footer_code"
                rows={8}
                defaultValue={site.custom_footer_code || ''}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono text-sm"
                placeholder="<!-- Scripts de tracking, widgets de chat, etc. -->"
              />
              <p className="text-xs text-gray-500 mt-1">
                Code injecté avant la fermeture du &lt;/body&gt; (scripts de tracking, widgets)
              </p>
            </div>
          </div>
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
