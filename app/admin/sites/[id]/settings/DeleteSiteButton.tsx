'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  siteId: string;
  siteName: string;
}

export default function DeleteSiteButton({ siteId, siteName }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function handleDelete() {
    if (confirmText !== siteName) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Rediriger vers la liste des sites
      router.push('/admin/sites');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setIsDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Supprimer le site
      </button>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
        <p className="text-red-300 text-sm mb-3">
          ⚠️ <strong>ATTENTION :</strong> Cette action est irréversible. Tous les contenus, médias, menus et domaines associés seront définitivement supprimés.
        </p>
        <p className="text-white text-sm mb-2">
          Pour confirmer, tapez le nom exact du site : <strong className="text-red-400">{siteName}</strong>
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={siteName}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded mb-3 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowConfirm(false);
              setConfirmText('');
            }}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmText !== siteName || isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
}
