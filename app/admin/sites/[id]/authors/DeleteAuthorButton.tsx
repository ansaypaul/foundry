'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteAuthorButtonProps {
  siteId: string;
  authorId: string;
  authorName: string;
}

export default function DeleteAuthorButton({ siteId, authorId, authorName }: DeleteAuthorButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'auteur "${authorName}" ?\n\nLes articles de cet auteur ne seront pas supprimés mais n'auront plus d'auteur associé.`)) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/authors/${authorId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Erreur lors de la suppression de l\'auteur');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? 'Suppression...' : 'Supprimer'}
    </button>
  );
}
