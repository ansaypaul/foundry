'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  siteId: string;
  siteName: string;
}

export default function ResetContentButton({ siteId, siteName }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleReset = async () => {
    if (confirmText !== siteName) {
      alert('Le nom du site ne correspond pas');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/sites/${siteId}/reset-content`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      alert('Le contenu du site a été réinitialisé avec succès');
      setShowConfirm(false);
      setConfirmText('');
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
      >
        Réinitialiser le contenu
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-orange-900/20 border border-orange-600/50 rounded-lg">
        <p className="text-sm text-orange-300 mb-3">
          ⚠️ Cette action va supprimer :
        </p>
        <ul className="text-sm text-gray-300 space-y-1 mb-4 list-disc list-inside">
          <li>Tous les articles (posts)</li>
          <li>Toutes les pages</li>
          <li>Tous les auteurs</li>
          <li>Toutes les catégories et taxonomies</li>
          <li>Tous les types de contenu personnalisés</li>
          <li>Tous les menus et leurs items</li>
          <li>Le blueprint et les idées de contenu</li>
        </ul>
        <p className="text-sm text-white font-medium mb-3">
          Le site lui-même et ses domaines ne seront PAS supprimés.
        </p>
        <p className="text-sm text-orange-300 mb-3">
          Pour confirmer, tapez le nom du site : <strong>{siteName}</strong>
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={siteName}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleReset}
          disabled={isDeleting || confirmText !== siteName}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isDeleting ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setConfirmText('');
          }}
          disabled={isDeleting}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
