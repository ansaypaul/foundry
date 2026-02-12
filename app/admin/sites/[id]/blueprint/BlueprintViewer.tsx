'use client';

import { useState } from 'react';
import { PrimaryButton, SecondaryButton, ErrorMessage, SuccessMessage, Input, Label } from '@/app/admin/components/FormComponents';

interface BlueprintPreview {
  blueprint: any;
  existingVersions: number;
  nextVersion: number;
}

export default function BlueprintViewer({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BlueprintPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [showJson, setShowJson] = useState(false);

  async function loadPreview() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/sites/${siteId}/blueprint`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  async function saveBlueprint() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/sites/${siteId}/blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      const data = await response.json();
      setSuccess(data.message);
      setNotes('');
      
      // Reload preview
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  if (!preview && !loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Blueprint</h3>
        <p className="text-gray-400 mb-4">
          Le blueprint est un snapshot complet de la configuration actuelle du site.
        </p>
        <PrimaryButton onClick={loadPreview}>
          Prévisualiser le blueprint
        </PrimaryButton>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Blueprint</h3>
        <p className="text-gray-400">Génération du blueprint...</p>
      </div>
    );
  }

  if (!preview) return null;

  const bp = preview.blueprint;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Blueprint v{preview.nextVersion}
      </h3>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {/* Summary */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <div className="text-gray-400">Auteurs</div>
            <div className="text-white font-medium text-2xl">{bp.authors.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Catégories</div>
            <div className="text-white font-medium text-2xl">{bp.taxonomy.categories.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Pages</div>
            <div className="text-white font-medium text-2xl">{bp.pages.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Types de contenu</div>
            <div className="text-white font-medium text-2xl">{bp.contentTypes.length}</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 pt-3 border-t border-gray-700">
          <div>Taille: {bp.decisionProfile.siteSize}</div>
          <div>Vélocité: {bp.decisionProfile.velocity}</div>
          <div>Généré le: {new Date(bp.generatedAt).toLocaleString('fr-FR')}</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <details className="bg-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-white font-medium">
            Auteurs ({bp.authors.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {bp.authors.map((a: any, i: number) => (
              <li key={i}>• {a.displayName} ({a.roleKey})</li>
            ))}
          </ul>
        </details>

        <details className="bg-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-white font-medium">
            Catégories ({bp.taxonomy.categories.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {bp.taxonomy.categories.map((c: any, i: number) => (
              <li key={i}>• {c.name} ({c.slug})</li>
            ))}
          </ul>
        </details>

        <details className="bg-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-white font-medium">
            Pages ({bp.pages.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {bp.pages.map((p: any, i: number) => (
              <li key={i}>• {p.title} ({p.type})</li>
            ))}
          </ul>
        </details>

        <details className="bg-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-white font-medium">
            Types de contenu ({bp.contentTypes.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {bp.contentTypes.map((ct: any, i: number) => (
              <li key={i}>• {ct.label} ({ct.key})</li>
            ))}
          </ul>
        </details>

        <details className="bg-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-white font-medium">
            JSON complet
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(bp, null, 2)}
          </pre>
        </details>
      </div>

      {/* Save section */}
      <div className="pt-4 border-t border-gray-700">
        <div className="mb-4">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Snapshot initial / Après setup auteurs / etc."
          />
        </div>

        <div className="flex gap-3">
          <PrimaryButton onClick={saveBlueprint} disabled={saving}>
            {saving ? 'Enregistrement...' : `Enregistrer comme v${preview.nextVersion}`}
          </PrimaryButton>
          <SecondaryButton onClick={loadPreview} disabled={saving}>
            Rafraîchir
          </SecondaryButton>
        </div>

        {preview.existingVersions > 0 && (
          <p className="text-sm text-gray-400 mt-3">
            {preview.existingVersions} version(s) existante(s)
          </p>
        )}
      </div>
    </div>
  );
}
