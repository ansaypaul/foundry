'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Select, Label, FormCard, ErrorMessage, HelperText, PrimaryButton, SecondaryButton } from '@/app/admin/components/FormComponents';

interface Theme {
  id: string;
  name: string;
  key: string;
}

export default function NewSitePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [themeId, setThemeId] = useState<string>('');
  const [status, setStatus] = useState('active');
  const [themes, setThemes] = useState<Theme[]>([]);
  
  // AI Bootstrap fields
  const [language, setLanguage] = useState('fr');
  const [country, setCountry] = useState('FR');
  const [siteType, setSiteType] = useState('niche_passion');
  const [automationLevel, setAutomationLevel] = useState('manual');
  const [ambitionLevel, setAmbitionLevel] = useState('auto');
  const [description, setDescription] = useState('');

  // Charger les thèmes
  useEffect(() => {
    async function loadThemes() {
      try {
        const response = await fetch('/api/admin/themes');
        if (response.ok) {
          const data = await response.json();
          setThemes(data.themes || []);
          // Sélectionner le premier thème par défaut
          if (data.themes && data.themes.length > 0) {
            setThemeId(data.themes[0].id);
          }
        }
      } catch (err) {
        console.error('Erreur chargement thèmes:', err);
      }
    }
    loadThemes();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          theme_id: themeId || null,
          status,
          language,
          country,
          site_type: siteType,
          automation_level: automationLevel,
          ambition_level: ambitionLevel,
          description: description.trim() || null,
          setup_status: 'draft', // All new sites start in draft mode
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création du site');
      }

      const { site } = await response.json();
      
      // Rediriger vers la page du site (qui affichera le banner si draft)
      router.push(`/admin/sites/${site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/sites" 
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Retour aux sites
        </Link>
        <h2 className="text-3xl font-bold text-white mt-2">Créer un nouveau site</h2>
        <p className="text-gray-400 mt-2">
          Créez un nouveau site éditorial. Vous pourrez ajouter des domaines après la création.
        </p>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        <FormCard>
          <div className="space-y-6">
            {/* Nom du site */}
            <div>
              <Label htmlFor="name">Nom du site *</Label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mon Super Site"
              />
              <HelperText>
                Le nom du site tel qu'il apparaîtra dans l'admin et sur le site public.
              </HelperText>
            </div>

            {/* Thème */}
            <div>
              <Label htmlFor="theme_id">Thème</Label>
              <Select
                id="theme_id"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
              >
                {themes.length === 0 ? (
                  <option value="">Chargement...</option>
                ) : (
                  themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))
                )}
              </Select>
              <HelperText>
                Le thème définit l'apparence visuelle du site.
              </HelperText>
            </div>

            {/* Statut */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
              </Select>
              <HelperText>
                Un site en pause ne sera pas accessible publiquement.
              </HelperText>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-1">Configuration du site</h3>
              <p className="text-sm text-gray-400 mb-4">
                Ces paramètres prépareront le site pour la génération de contenu.
              </p>
            </div>

            {/* Language */}
            <div>
              <Label htmlFor="language">Langue du site *</Label>
              <Select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
              </Select>
              <HelperText>
                La langue principale du contenu du site.
              </HelperText>
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country">Pays cible *</Label>
              <Select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              >
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
              <HelperText>
                Le pays principal visé par le contenu.
              </HelperText>
            </div>

            {/* Site Type */}
            <div>
              <Label htmlFor="site_type">Type de site *</Label>
              <Select
                id="site_type"
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                required
              >
                <option value="niche_passion">Niche / Passion</option>
                <option value="news_media">Actualités / Média</option>
                <option value="gaming_popculture">Gaming / Pop Culture</option>
                <option value="affiliate_guides">Guides / Affiliation</option>
                <option value="lifestyle">Lifestyle</option>
              </Select>
              <HelperText>
                Le type de site influence la stratégie de contenu.
              </HelperText>
            </div>

            {/* Automation Level */}
            <div>
              <Label htmlFor="automation_level">Niveau d'automatisation *</Label>
              <Select
                id="automation_level"
                value={automationLevel}
                onChange={(e) => setAutomationLevel(e.target.value)}
                required
              >
                <option value="manual">Manuel</option>
                <option value="ai_assisted">Assisté par IA</option>
                <option value="ai_auto">Automatique (IA)</option>
              </Select>
              <HelperText>
                Définit le niveau d'intervention de l'IA dans la création de contenu.
              </HelperText>
            </div>

            {/* Ambition Level */}
            <div>
              <Label htmlFor="ambition_level">Niveau d'ambition *</Label>
              <Select
                id="ambition_level"
                value={ambitionLevel}
                onChange={(e) => setAmbitionLevel(e.target.value)}
                required
              >
                <option value="auto">Auto (recommandé)</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="factory">Factory</option>
              </Select>
              <HelperText>
                Définit l'échelle du site (nombre d'auteurs, catégories, vélocité de publication).
              </HelperText>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description du site</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Décrivez brièvement la niche et l'objectif du site..."
              />
              <HelperText>
                Une courte description pour guider la génération de contenu (optionnel).
              </HelperText>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-700">
            <Link
              href="/admin/sites"
              className="text-sm text-gray-400 hover:text-white"
            >
              Annuler
            </Link>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le site'}
            </PrimaryButton>
          </div>
        </FormCard>
      </form>
    </div>
  );
}
