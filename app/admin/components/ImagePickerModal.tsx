'use client';

import { useState, useEffect } from 'react';
import { Label, Input, Textarea, PrimaryButton, SecondaryButton } from './FormComponents';

interface Media {
  id: string;
  url: string;
  filename: string;
  alt_text?: string;
  title?: string;
  caption?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media, imageProps: { alt?: string; title?: string }) => void;
  siteId: string;
}

export default function ImagePickerModal({ isOpen, onClose, onSelect, siteId }: Props) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Props d'image éditables
  const [altText, setAltText] = useState('');
  const [imageTitle, setImageTitle] = useState('');

  useEffect(() => {
    if (isOpen && siteId) {
      loadMedia();
    }
  }, [isOpen, siteId]);

  useEffect(() => {
    if (selectedMedia) {
      setAltText(selectedMedia.alt_text || '');
      setImageTitle(selectedMedia.title || '');
    }
  }, [selectedMedia]);

  async function loadMedia() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?site_id=${siteId}`);
      const data = await response.json();
      setMediaList(data.media || []);
    } catch (error) {
      console.error('Erreur chargement médias:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('site_id', siteId);

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur upload');

      const { media } = await response.json();
      setSelectedMedia(media);
      setActiveTab('gallery');
      await loadMedia();
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  }

  function handleInsert() {
    if (selectedMedia) {
      onSelect(selectedMedia, {
        alt: altText,
        title: imageTitle,
      });
      handleClose();
    }
  }

  function handleClose() {
    setSelectedMedia(null);
    setAltText('');
    setImageTitle('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Ajouter une image</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'gallery'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Galerie
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Téléverser
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Liste des médias ou upload */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'gallery' ? (
              loading ? (
                <p className="text-gray-400 text-center py-8">Chargement...</p>
              ) : mediaList.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Aucun média</p>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {mediaList.map((media) => (
                    <button
                      type="button"
                      key={media.id}
                      onClick={() => setSelectedMedia(media)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia?.id === media.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={media.url}
                        alt={media.alt_text || media.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? 'Upload en cours...' : 'Choisir une image'}
                </label>
                <p className="text-gray-400 text-sm mt-4">
                  Formats acceptés : JPG, PNG, GIF, WebP
                </p>
              </div>
            )}
          </div>

          {/* Panneau de détails */}
          {selectedMedia && (
            <div className="w-80 border-l border-gray-700 p-6 overflow-y-auto bg-gray-900">
              <h3 className="text-lg font-semibold text-white mb-4">Détails de l'image</h3>
              
              {/* Aperçu */}
              <div className="mb-4 rounded-lg overflow-hidden bg-gray-800">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  className="w-full"
                />
              </div>

              {/* Informations */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-alt">Texte alternatif</Label>
                  <Input
                    id="image-alt"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Description de l'image"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pour l'accessibilité et le SEO</p>
                </div>

                <div>
                  <Label htmlFor="image-title">Titre</Label>
                  <Input
                    id="image-title"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    placeholder="Titre de l'image"
                  />
                </div>

                <div>
                  <Label>Nom du fichier</Label>
                  <p className="text-sm text-gray-400 bg-gray-800 p-2 rounded">
                    {selectedMedia.filename}
                  </p>
                </div>

                {selectedMedia.caption && (
                  <div>
                    <Label>Légende</Label>
                    <p className="text-sm text-gray-400 bg-gray-800 p-2 rounded">
                      {selectedMedia.caption}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <SecondaryButton onClick={handleClose}>
            Annuler
          </SecondaryButton>
          <PrimaryButton
            onClick={handleInsert}
            disabled={!selectedMedia}
          >
            Insérer l'image
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
