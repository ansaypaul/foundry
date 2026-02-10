'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Media {
  id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

interface MediaUploaderProps {
  siteId: string;
  selectedMediaId: string | null;
  onSelect: (mediaId: string | null, mediaUrl?: string) => void;
  buttonText?: string;
  buttonClassName?: string;
  accept?: string;
  maxSizeMB?: number;
  mode?: 'default' | 'avatar'; // Mode avatar pour preview circulaire
}

export default function MediaUploader({
  siteId,
  selectedMediaId,
  onSelect,
  buttonText = 'Choisir une image',
  buttonClassName = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
  accept = 'image/*',
  maxSizeMB = 5,
  mode = 'default',
}: MediaUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  
  // Métadonnées éditables
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger l'image sélectionnée au montage
  useEffect(() => {
    if (selectedMediaId && !currentMedia) {
      loadCurrentMedia();
    }
  }, [selectedMediaId]);

  const loadCurrentMedia = async () => {
    if (!selectedMediaId) return;
    
    try {
      const response = await fetch(`/api/admin/media/${selectedMediaId}`);
      if (response.ok) {
        const { media } = await response.json();
        setCurrentMedia(media);
      }
    } catch (err) {
      console.error('Error loading current media:', err);
    }
  };

  const openModal = async () => {
    setIsOpen(true);
    setActiveTab('library');
    setError(null);
    await loadMedia();
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedMedia(null);
    setError(null);
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?site_id=${siteId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setMediaList(data.media || []);
      
      // Pré-sélectionner le média actuel si existant
      if (selectedMediaId) {
        const current = data.media?.find((m: Media) => m.id === selectedMediaId);
        if (current) {
          setSelectedMedia(current);
          setEditTitle(current.title || '');
          setEditAlt(current.alt_text || '');
          setEditDescription(current.description || '');
        }
      }
    } catch (err) {
      setError('Impossible de charger les médias');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }
    
    // Vérifier la taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`L'image ne doit pas dépasser ${maxSizeMB}MB (taille actuelle: ${sizeMB.toFixed(2)}MB)`);
      return;
    }
    
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('site_id', siteId);
      
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }
      
      const data = await response.json();
      
      // Vérifier que media existe dans la réponse
      if (!data.media) {
        throw new Error('Réponse invalide du serveur');
      }
      
      const { media } = data;
      
      // Ajouter à la liste
      setMediaList(prev => [media, ...prev]);
      
      // Sélectionner automatiquement
      setSelectedMedia(media);
      setEditTitle(media.title || '');
      setEditAlt(media.alt_text || '');
      setEditDescription(media.description || '');
      
      // Basculer sur la bibliothèque
      setActiveTab('library');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaClick = (media: Media) => {
    setSelectedMedia(media);
    setEditTitle(media.title || '');
    setEditAlt(media.alt_text || '');
    setEditDescription(media.description || '');
  };

  const handleSaveMetadata = async () => {
    if (!selectedMedia) return;
    
    try {
      const response = await fetch(`/api/admin/media/${selectedMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle || null,
          alt_text: editAlt || null,
          description: editDescription || null,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
      // Mettre à jour dans la liste
      setMediaList(prev =>
        prev.map(m =>
          m.id === selectedMedia.id
            ? { ...m, title: editTitle, alt_text: editAlt, description: editDescription }
            : m
        )
      );
      
      setSelectedMedia(prev =>
        prev ? { ...prev, title: editTitle, alt_text: editAlt, description: editDescription } : null
      );
    } catch (err) {
      setError('Impossible de sauvegarder les métadonnées');
    }
  };

  const handleSelectMedia = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.id, selectedMedia.url);
      setCurrentMedia(selectedMedia);
      closeModal();
    }
  };

  const handleRemoveMedia = () => {
    onSelect(null);
    setCurrentMedia(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <>
      {/* Preview de l'image sélectionnée ou bouton */}
      {currentMedia ? (
        <div className="space-y-3">
          {/* Preview */}
          <div className={`relative overflow-hidden bg-gray-900 border border-gray-700 ${
            mode === 'avatar' 
              ? 'w-32 h-32 rounded-full mx-auto' 
              : 'aspect-video rounded-lg'
          }`}>
            <Image
              src={currentMedia.url}
              alt={currentMedia.alt_text || currentMedia.filename}
              fill
              className={mode === 'avatar' ? 'object-cover' : 'object-contain'}
            />
          </div>
          
          {/* Infos et actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 truncate flex-1">
              <p className="truncate">{currentMedia.filename}</p>
              {currentMedia.file_size && (
                <p className="text-xs">
                  {(currentMedia.file_size / 1024).toFixed(2)} KB
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                type="button"
                onClick={openModal}
                className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className={buttonClassName}
        >
          {buttonText}
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Médiathèque</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bibliothèque
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Téléverser
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Panneau principal */}
              <div className="flex-1 overflow-y-auto p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-600/30 rounded text-red-400">
                    {error}
                  </div>
                )}

                {/* Tab: Upload */}
                {activeTab === 'upload' && (
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      
                      {uploading ? (
                        <div className="text-gray-400">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p>Téléversement en cours...</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-6xl mb-4">📁</div>
                          <p className="text-lg text-white mb-2">
                            Glissez-déposez votre image ici
                          </p>
                          <p className="text-gray-400 mb-4">ou</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Sélectionner un fichier
                          </button>
                          <p className="text-sm text-gray-400 mt-4">
                            Taille maximale: {maxSizeMB}MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Library */}
                {activeTab === 'library' && (
                  <div>
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Chargement...</p>
                      </div>
                    ) : mediaList.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">Aucun média</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Téléverser votre première image
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4">
                        {mediaList.map((media) => (
                          <button
                            key={media.id}
                            type="button"
                            onClick={() => handleMediaClick(media)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedMedia?.id === media.id
                                ? 'border-blue-500 ring-2 ring-blue-500'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <Image
                              src={media.url}
                              alt={media.alt_text || media.filename}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar: Détails du média sélectionné */}
              {selectedMedia && (
                <div className="w-80 border-l border-gray-700 p-6 overflow-y-auto bg-gray-900">
                  <h3 className="text-lg font-semibold text-white mb-4">Détails de l'image</h3>
                  
                  {/* Prévisualisation */}
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-gray-800">
                    <Image
                      src={selectedMedia.url}
                      alt={selectedMedia.alt_text || selectedMedia.filename}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Métadonnées */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveMetadata}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                        placeholder="Titre de l'image"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Texte alternatif
                      </label>
                      <input
                        type="text"
                        value={editAlt}
                        onChange={(e) => setEditAlt(e.target.value)}
                        onBlur={handleSaveMetadata}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                        placeholder="Description pour l'accessibilité"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onBlur={handleSaveMetadata}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                        placeholder="Description détaillée"
                      />
                    </div>
                    
                    {/* Infos fichier */}
                    <div className="pt-4 border-t border-gray-700 space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Fichier:</span>
                        <p className="text-white truncate">{selectedMedia.filename}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <p className="text-white">{selectedMedia.mime_type}</p>
                      </div>
                      {selectedMedia.file_size && (
                        <div>
                          <span className="text-gray-400">Taille:</span>
                          <p className="text-white">
                            {(selectedMedia.file_size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">URL:</span>
                        <input
                          type="text"
                          value={selectedMedia.url}
                          readOnly
                          className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400"
                          onClick={(e) => e.currentTarget.select()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  handleRemoveMedia();
                  closeModal();
                }}
                className="text-gray-400 hover:text-white"
              >
                Supprimer l'image
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSelectMedia}
                  disabled={!selectedMedia}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sélectionner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
