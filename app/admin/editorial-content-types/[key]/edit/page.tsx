'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PrimaryButton, SecondaryButton, Input, Label, ErrorMessage, SuccessMessage } from '@/app/admin/components/FormComponents';

interface PageProps {
  params: Promise<{ key: string }>;
}

export default function EditContentTypePage({ params }: PageProps) {
  const router = useRouter();
  const [contentTypeKey, setContentTypeKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'general' | 'template' | 'prompts' | 'validation' | 'format'>('general');
  
  // Form state
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSystem, setIsSystem] = useState(false);
  
  const [templateSchema, setTemplateSchema] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [planPrompt, setPlanPrompt] = useState('');
  const [formatPrompt, setFormatPrompt] = useState('');
  const [notes, setNotes] = useState('');
  
  const [validatorProfile, setValidatorProfile] = useState('');
  const [allowedHtmlTags, setAllowedHtmlTags] = useState('');
  const [forbiddenPatterns, setForbiddenPatterns] = useState('');
  
  useEffect(() => {
    params.then(p => {
      setContentTypeKey(p.key);
      loadContentType(p.key);
    });
  }, []);
  
  async function loadContentType(key: string) {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/editorial-content-types/${key}`);
      
      if (!response.ok) {
        throw new Error('Failed to load content type');
      }
      
      const data = await response.json();
      const ct = data.contentType;
      
      setLabel(ct.label || '');
      setDescription(ct.description || '');
      setIsActive(ct.is_active ?? true);
      setIsSystem(ct.is_system ?? false);
      
      setTemplateSchema(JSON.stringify(ct.template_schema, null, 2));
      setSystemPrompt(ct.system_prompt || '');
      setStylePrompt(ct.style_prompt || '');
      setPlanPrompt(ct.plan_prompt || '');
      setFormatPrompt(ct.format_prompt || '');
      setNotes(ct.notes || '');
      
      setValidatorProfile(JSON.stringify(ct.validator_profile, null, 2));
      setAllowedHtmlTags(JSON.stringify(ct.allowed_html_tags, null, 2));
      setForbiddenPatterns(JSON.stringify(ct.forbidden_patterns, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Parse JSON fields
      let parsedTemplateSchema, parsedValidatorProfile, parsedAllowedTags, parsedForbiddenPatterns;
      
      try {
        parsedTemplateSchema = JSON.parse(templateSchema);
        parsedValidatorProfile = JSON.parse(validatorProfile);
        parsedAllowedTags = JSON.parse(allowedHtmlTags);
        parsedForbiddenPatterns = JSON.parse(forbiddenPatterns);
      } catch (parseError) {
        throw new Error('JSON invalide dans un des champs');
      }
      
      const response = await fetch(`/api/admin/editorial-content-types/${contentTypeKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          description,
          is_active: isActive,
          template_schema: parsedTemplateSchema,
          system_prompt: systemPrompt || null,
          style_prompt: stylePrompt || null,
          plan_prompt: planPrompt || null,
          format_prompt: formatPrompt || null,
          notes: notes || null,
          validator_profile: parsedValidatorProfile,
          allowed_html_tags: parsedAllowedTags,
          forbidden_patterns: parsedForbiddenPatterns,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }
      
      setSuccess('Type de contenu mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/editorial-content-types"
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Retour aux types de contenu
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">
          Éditer : <code className="text-purple-400">{contentTypeKey}</code>
        </h1>
        {isSystem && (
          <p className="text-sm text-yellow-300 mt-2">
            ⚠️ Type système - Modifier avec précaution
          </p>
        )}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex gap-4">
          {[
            { id: 'general', label: 'Général' },
            { id: 'template', label: 'Template' },
            { id: 'prompts', label: 'Prompts IA' },
            { id: 'validation', label: 'Validation' },
            { id: 'format', label: 'Format HTML' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Top 10"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description interne du type..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                Actif
              </label>
              
              {!isSystem && (
                <span className="text-xs text-gray-500">
                  (Les types inactifs ne sont plus proposés)
                </span>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'template' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateSchema">Template Schema (JSON)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Définition structurelle du type (blocks, rules)
              </p>
              <textarea
                id="templateSchema"
                value={templateSchema}
                onChange={(e) => setTemplateSchema(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={20}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <p className="text-xs text-gray-400 mb-2">
                Instructions système pour l'IA (rôle, objectif)
              </p>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>
            
            <div>
              <Label htmlFor="planPrompt">Plan Prompt</Label>
              <p className="text-xs text-gray-400 mb-2">
                Instructions de structure/plan
              </p>
              <textarea
                id="planPrompt"
                value={planPrompt}
                onChange={(e) => setPlanPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="stylePrompt">Style Prompt</Label>
              <p className="text-xs text-gray-400 mb-2">
                Instructions de ton/style
              </p>
              <textarea
                id="stylePrompt"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="formatPrompt">Format Prompt</Label>
              <p className="text-xs text-gray-400 mb-2">
                Instructions de format HTML
              </p>
              <textarea
                id="formatPrompt"
                value={formatPrompt}
                onChange={(e) => setFormatPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes pour l'équipe..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'validation' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="validatorProfile">Validator Profile (JSON)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Règles de validation (min_words, h2_count_exact, etc.)
              </p>
              <textarea
                id="validatorProfile"
                value={validatorProfile}
                onChange={(e) => setValidatorProfile(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={15}
              />
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-2">Champs disponibles :</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• <code>min_words</code>, <code>max_words</code></li>
                <li>• <code>h2_count_exact</code> (pour Top10)</li>
                <li>• <code>h2_count_min</code>, <code>h2_count_max</code></li>
                <li>• <code>min_paragraphs_per_h2</code></li>
                <li>• <code>max_lists</code></li>
                <li>• <code>forbidden_substrings</code> (array)</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'format' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="allowedHtmlTags">Allowed HTML Tags (JSON array)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Liste des balises HTML autorisées
              </p>
              <textarea
                id="allowedHtmlTags"
                value={allowedHtmlTags}
                onChange={(e) => setAllowedHtmlTags(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="forbiddenPatterns">Forbidden Patterns (JSON array)</Label>
              <p className="text-xs text-gray-400 mb-2">
                Patterns/strings interdits dans le contenu
              </p>
              <textarea
                id="forbiddenPatterns"
                value={forbiddenPatterns}
                onChange={(e) => setForbiddenPatterns(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push('/admin/editorial-content-types')}>
          Annuler
        </SecondaryButton>
      </div>
    </div>
  );
}
