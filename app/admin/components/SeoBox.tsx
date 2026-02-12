'use client';

/**
 * SEO Box Component
 * Composant d'édition des métadonnées SEO (type RankMath)
 * Affiche preview Google/Facebook/Twitter + analyse SEO en temps réel
 */

import { useState, useEffect, useMemo } from 'react';
import { Input, Textarea, Label, HelperText, Select } from './FormComponents';
import { analyzeSeo, type SeoAnalysisResult } from '@/lib/core/seo';
import type { Content, Term, Author } from '@/lib/db/types';

// ===================================
// TYPES
// ===================================

// Type pour les entités qui peuvent avoir des métadonnées SEO
export type SeoEntity = Partial<Content> | Partial<Term> | Partial<Author>;

export interface SeoBoxProps {
  // Données du contenu (Content ou Term)
  content: SeoEntity;
  
  // Callbacks pour mise à jour
  onUpdate: (field: string, value: any) => void;
  
  // Config
  siteUrl?: string;
  siteName?: string;
  
  // Options
  showAnalysis?: boolean;
  showPreview?: boolean;
  showAdvanced?: boolean;
}

// ===================================
// MAIN COMPONENT
// ===================================

export function SeoBox({
  content,
  onUpdate,
  siteUrl = 'https://example.com',
  siteName = 'Mon Site',
  showAnalysis = true,
  showPreview = true,
  showAdvanced = true,
}: SeoBoxProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'social' | 'advanced'>('general');
  
  // Valeurs SEO avec fallbacks pour preview
  // Support à la fois Content (title/excerpt) et Term (name/description)
  const contentTitle = 'title' in content ? content.title : ('name' in content ? content.name : '');
  const contentExcerpt = 'excerpt' in content ? content.excerpt : ('description' in content ? content.description : '');
  
  const seoTitle = content.seo_title || contentTitle || '';
  const seoDescription = content.seo_description || contentExcerpt || '';
  const ogImage = content.seo_og_image || null;
  
  // Analyse SEO (si contenu complet)
  const analysis: SeoAnalysisResult | null = useMemo(() => {
    if (!showAnalysis || !content.id) return null;
    try {
      return analyzeSeo(content as Content);
    } catch {
      return null;
    }
  }, [content, showAnalysis]);
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          SEO
        </h3>
        
        {analysis && (
          <div className="mt-3">
            <SeoScoreBadge score={analysis.score} />
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700 flex">
        <TabButton
          active={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
        >
          Général
        </TabButton>
        <TabButton
          active={activeTab === 'social'}
          onClick={() => setActiveTab('social')}
        >
          Réseaux sociaux
        </TabButton>
        {showAdvanced && (
          <TabButton
            active={activeTab === 'advanced'}
            onClick={() => setActiveTab('advanced')}
          >
            Avancé
          </TabButton>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {activeTab === 'general' && (
          <GeneralTab
            content={content}
            onUpdate={onUpdate}
            showPreview={showPreview}
            siteUrl={siteUrl}
            siteName={siteName}
          />
        )}
        
        {activeTab === 'social' && (
          <SocialTab
            content={content}
            onUpdate={onUpdate}
            showPreview={showPreview}
          />
        )}
        
        {activeTab === 'advanced' && showAdvanced && (
          <AdvancedTab
            content={content}
            onUpdate={onUpdate}
          />
        )}
        
        {/* Analysis */}
        {showAnalysis && analysis && activeTab === 'general' && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <SeoAnalysis analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}

// ===================================
// GENERAL TAB
// ===================================

function GeneralTab({
  content,
  onUpdate,
  showPreview,
  siteUrl,
  siteName,
}: {
  content: SeoEntity;
  onUpdate: (field: string, value: any) => void;
  showPreview: boolean;
  siteUrl: string;
  siteName: string;
}) {
  const contentTitle = 'title' in content ? content.title : ('name' in content ? content.name : '');
  const contentExcerpt = 'excerpt' in content ? content.excerpt : ('description' in content ? content.description : '');
  
  const seoTitle = content.seo_title || contentTitle || '';
  const seoDescription = content.seo_description || contentExcerpt || '';
  
  const titleLength = seoTitle.length;
  const descLength = seoDescription.length;
  
  return (
    <div className="space-y-6">
      {/* Preview Google */}
      {showPreview && (
        <div>
          <Label>Aperçu Google</Label>
          <GooglePreview
            title={seoTitle}
            description={seoDescription}
            url={`${siteUrl}/blog/${content.slug || 'example'}`}
            siteName={siteName}
          />
        </div>
      )}
      
      {/* Titre SEO */}
      <div>
        <Label htmlFor="seo_title">
          Titre SEO
          <CharCounter current={titleLength} max={60} ideal={55} className="ml-2" />
        </Label>
        <Input
          id="seo_title"
          type="text"
          value={content.seo_title || ''}
          onChange={(e) => onUpdate('seo_title', e.target.value)}
          placeholder={contentTitle || 'Titre de la page'}
          maxLength={70}
        />
        <HelperText>
          {content.seo_title
            ? 'Titre SEO personnalisé'
            : `Fallback: "${contentTitle || 'Titre de la page'}"`}
        </HelperText>
      </div>
      
      {/* Meta Description */}
      <div>
        <Label htmlFor="seo_description">
          Meta Description
          <CharCounter current={descLength} max={160} ideal={155} className="ml-2" />
        </Label>
        <Textarea
          id="seo_description"
          value={content.seo_description || ''}
          onChange={(e) => onUpdate('seo_description', e.target.value)}
          placeholder={contentExcerpt || 'Description de la page...'}
          rows={3}
          maxLength={200}
        />
        <HelperText>
          {content.seo_description
            ? 'Description personnalisée'
            : contentExcerpt
            ? 'Fallback: extrait/description'
            : 'Aucune description définie'}
        </HelperText>
      </div>
      
      {/* Focus Keyword */}
      <div>
        <Label htmlFor="seo_focus_keyword">Mot-clé principal (optionnel)</Label>
        <Input
          id="seo_focus_keyword"
          type="text"
          value={(content as any).seo_focus_keyword || ''}
          onChange={(e) => onUpdate('seo_focus_keyword', e.target.value)}
          placeholder="ex: marketing digital"
        />
        <HelperText>
          Utilisé pour l'analyse SEO et les suggestions
        </HelperText>
      </div>
    </div>
  );
}

// ===================================
// SOCIAL TAB
// ===================================

function SocialTab({
  content,
  onUpdate,
  showPreview,
}: {
  content: SeoEntity;
  onUpdate: (field: string, value: any) => void;
  showPreview: boolean;
}) {
  const contentTitle = 'title' in content ? content.title : ('name' in content ? content.name : '');
  const contentExcerpt = 'excerpt' in content ? content.excerpt : ('description' in content ? content.description : '');
  
  const ogTitle = content.seo_og_title || content.seo_title || contentTitle || '';
  const ogDescription = content.seo_og_description || content.seo_description || contentExcerpt || '';
  const ogImage = content.seo_og_image || null;
  
  return (
    <div className="space-y-6">
      {/* Preview Facebook */}
      {showPreview && (
        <div>
          <Label>Aperçu Facebook / LinkedIn</Label>
          <FacebookPreview
            title={ogTitle}
            description={ogDescription}
            image={ogImage}
            url="example.com"
          />
        </div>
      )}
      
      {/* Open Graph Title */}
      <div>
        <Label htmlFor="seo_og_title">Titre Open Graph</Label>
        <Input
          id="seo_og_title"
          type="text"
          value={content.seo_og_title || ''}
          onChange={(e) => onUpdate('seo_og_title', e.target.value)}
          placeholder={content.seo_title || contentTitle || 'Titre'}
        />
        <HelperText>
          {content.seo_og_title ? 'Titre OG personnalisé' : 'Fallback: titre SEO'}
        </HelperText>
      </div>
      
      {/* Open Graph Description */}
      <div>
        <Label htmlFor="seo_og_description">Description Open Graph</Label>
        <Textarea
          id="seo_og_description"
          value={content.seo_og_description || ''}
          onChange={(e) => onUpdate('seo_og_description', e.target.value)}
          placeholder={content.seo_description || contentExcerpt || 'Description'}
          rows={3}
        />
        <HelperText>
          {content.seo_og_description ? 'Description OG personnalisée' : 'Fallback: meta description'}
        </HelperText>
      </div>
      
      {/* Open Graph Image */}
      <div>
        <Label htmlFor="seo_og_image">Image Open Graph</Label>
        <Input
          id="seo_og_image"
          type="text"
          value={content.seo_og_image || ''}
          onChange={(e) => onUpdate('seo_og_image', e.target.value)}
          placeholder="/images/og-default.jpg"
        />
        <HelperText>
          Taille recommandée: 1200x630px. Si vide, utilise l'image à la une.
        </HelperText>
      </div>
      
      {/* Twitter Card Type */}
      <div>
        <Label htmlFor="seo_twitter_card">Type de Twitter Card</Label>
        <Select
          id="seo_twitter_card"
          value={content.seo_twitter_card || 'summary_large_image'}
          onChange={(e) => onUpdate('seo_twitter_card', e.target.value)}
        >
          <option value="summary_large_image">Large Image (recommandé)</option>
          <option value="summary">Summary</option>
        </Select>
      </div>
    </div>
  );
}

// ===================================
// ADVANCED TAB
// ===================================

function AdvancedTab({
  content,
  onUpdate,
}: {
  content: SeoEntity;
  onUpdate: (field: string, value: any) => void;
}) {
  const contentTitle = 'title' in content ? content.title : ('name' in content ? content.name : '');
  return (
    <div className="space-y-6">
      {/* Canonical URL */}
      <div>
        <Label htmlFor="seo_canonical">URL Canonique</Label>
        <Input
          id="seo_canonical"
          type="text"
          value={content.seo_canonical || ''}
          onChange={(e) => onUpdate('seo_canonical', e.target.value)}
          placeholder="https://example.com/page (auto si vide)"
        />
        <HelperText>
          Laissez vide pour génération automatique
        </HelperText>
      </div>
      
      {/* Robots Meta */}
      <div className="space-y-4">
        <Label>Directives Robots</Label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={content.seo_robots_index ?? true}
            onChange={(e) => onUpdate('seo_robots_index', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-200">Index</div>
            <div className="text-xs text-gray-400">Autoriser l'indexation par les moteurs de recherche</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={content.seo_robots_follow ?? true}
            onChange={(e) => onUpdate('seo_robots_follow', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-200">Follow</div>
            <div className="text-xs text-gray-400">Autoriser le suivi des liens par les moteurs</div>
          </div>
        </label>
      </div>
      
      {/* Breadcrumb Title Override */}
      <div>
        <Label htmlFor="seo_breadcrumb_title">Titre dans le fil d'Ariane</Label>
        <Input
          id="seo_breadcrumb_title"
          type="text"
          value={(content as any).seo_breadcrumb_title || ''}
          onChange={(e) => onUpdate('seo_breadcrumb_title', e.target.value)}
          placeholder={contentTitle || 'Titre de la page'}
        />
        <HelperText>
          Version courte pour les breadcrumbs (optionnel)
        </HelperText>
      </div>
    </div>
  );
}

// ===================================
// PREVIEWS
// ===================================

function GooglePreview({
  title,
  description,
  url,
  siteName,
}: {
  title: string;
  description: string;
  url: string;
  siteName: string;
}) {
  const displayTitle = title || siteName;
  const displayDesc = description || 'Aucune description';
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-sans">
      <div className="text-xs text-gray-500 mb-1">{url}</div>
      <div className="text-blue-400 text-lg mb-1 hover:underline cursor-pointer">
        {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '...' : displayTitle}
      </div>
      <div className="text-gray-400 text-sm">
        {displayDesc.length > 160 ? displayDesc.slice(0, 160) + '...' : displayDesc}
      </div>
    </div>
  );
}

function FacebookPreview({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image: string | null;
  url: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {image && (
        <div className="aspect-[1.91/1] bg-gray-800 flex items-center justify-center">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="text-xs text-gray-500 uppercase mb-1">{url}</div>
        <div className="text-white font-semibold mb-1">{title || 'Sans titre'}</div>
        <div className="text-gray-400 text-sm line-clamp-2">
          {description || 'Aucune description'}
        </div>
      </div>
    </div>
  );
}

// ===================================
// SEO ANALYSIS
// ===================================

function SeoAnalysis({ analysis }: { analysis: SeoAnalysisResult }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white">Analyse SEO</h4>
      
      <div className="space-y-2">
        {analysis.checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <StatusIcon status={check.status} />
              <span className="text-gray-300">{check.label}</span>
            </div>
            <span className="text-gray-400 text-xs">
              {check.score}/{check.maxScore}
            </span>
          </div>
        ))}
      </div>
      
      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="text-xs font-semibold text-yellow-400 mb-2">Recommandations</div>
          <ul className="text-xs text-yellow-300 space-y-1">
            {analysis.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ===================================
// UI COMPONENTS
// ===================================

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
          : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function SeoScoreBadge({ score }: { score: number }) {
  let color: 'green' | 'yellow' | 'orange' | 'red' = 'red';
  let label = 'À améliorer';
  
  if (score >= 80) {
    color = 'green';
    label = 'Excellent';
  } else if (score >= 60) {
    color = 'yellow';
    label = 'Bon';
  } else if (score >= 40) {
    color = 'orange';
    label = 'Moyen';
  }
  
  const colorClasses = {
    green: 'bg-green-900/20 border-green-500 text-green-400',
    yellow: 'bg-yellow-900/20 border-yellow-500 text-yellow-400',
    orange: 'bg-orange-900/20 border-orange-500 text-orange-400',
    red: 'bg-red-900/20 border-red-500 text-red-400',
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClasses[color]}`}>
      <span className="text-xs font-semibold">Score SEO:</span>
      <span className="text-lg font-bold">{score}/100</span>
      <span className="text-xs opacity-75">({label})</span>
    </div>
  );
}

function StatusIcon({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  if (status === 'pass') {
    return (
      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  
  if (status === 'warning') {
    return (
      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function CharCounter({
  current,
  max,
  ideal,
  className = '',
}: {
  current: number;
  max: number;
  ideal: number;
  className?: string;
}) {
  let color = 'text-gray-400';
  
  if (current === 0) {
    color = 'text-gray-500';
  } else if (current < 30) {
    color = 'text-red-400';
  } else if (current <= ideal) {
    color = 'text-green-400';
  } else if (current <= max) {
    color = 'text-yellow-400';
  } else {
    color = 'text-red-400';
  }
  
  return (
    <span className={`text-xs font-normal ${color} ${className}`}>
      ({current}/{max})
    </span>
  );
}
