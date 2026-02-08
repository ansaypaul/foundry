'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Label, PrimaryButton, SecondaryButton } from './FormComponents';

interface Props {
  siteId: string;
  selectedMediaId?: string | null;
  onSelect: (mediaId: string | null, url?: string | null) => void;
}

export default function MediaPicker({ siteId, selectedMediaId, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && siteId) {
      loadMedia();
    }
  }, [isOpen, siteId]);

  useEffect(() => {
    if (selectedMediaId && siteId) {
      loadSelectedMedia();
    }
  }, [selectedMediaId, siteId]);

  async function loadMedia() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/media?site_id=${siteId}`);
      const data = await response.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSelectedMedia() {
    try {
      const response = await fetch(`/api/admin/media?site_id=${siteId}`);
      const data = await response.json();
      const found = (data.media || []).find((m: any) => m.id === selectedMediaId);
      if (found) {
        setSelectedMedia(found);
      }
    } catch (err) {
      console.error('Error loading selected media:', err);
    }
  }

  async function handleUpload() {
    setUploading(true);
    setUploadError(null);

    const fileInput = document.getElementById('media-file-input') as HTMLInputElement;
    const altTextInput = document.getElementById('media-alt-text') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file || file.size === 0) {
      setUploadError('Sélectionnez un fichier');
      setUploading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('site_id', siteId);
      uploadData.append('alt_text', altTextInput?.value || '');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur d\'upload');
      }

      const { media: newMedia } = await res.json();
      
      // Sélectionner automatiquement le média uploadé
      setSelectedMedia(newMedia);
      onSelect(newMedia.id, newMedia.url);
      
      // Rafraîchir la galerie et fermer
      loadMedia();
      setIsOpen(false);
      
      // Reset inputs
      if (fileInput) fileInput.value = '';
      if (altTextInput) altTextInput.value = '';
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur d\'upload');
    } finally {
      setUploading(false);
    }
  }

  function handleSelect(media: any) {
    setSelectedMedia(media);
    onSelect(media.id, media.url);
    setIsOpen(false);
  }

  function handleRemove() {
    setSelectedMedia(null);
    onSelect(null, null);
  }

  if (!siteId) {
    return null;
  }

  return (
    <div>
      {selectedMedia ? (
        <div className="relative w-full">
          <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-600">
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.alt_text || selectedMedia.filename}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <SecondaryButton
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex-1"
            >
              Changer
            </SecondaryButton>
            <SecondaryButton
              type="button"
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300"
            >
              Retirer
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full aspect-video flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700/50 transition-colors"
        >
          <div className="text-center">
            <p className="text-gray-300">📷 Sélectionner une image</p>
            <p className="text-sm text-gray-400 mt-1">Cliquez pour choisir ou uploader</p>
          </div>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header avec onglets */}
            <div className="border-b border-gray-700">
              <div className="p-6 pb-0 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  Sélectionner une image
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Onglets */}
              <div className="flex px-6 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'gallery'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Galerie
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'gallery' ? (
                // Onglet Galerie
                isLoading ? (
                  <p className="text-gray-400 text-center py-8">Chargement...</p>
                ) : media.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">Aucune image disponible.</p>
                    <SecondaryButton
                      type="button"
                      onClick={() => setActiveTab('upload')}
                    >
                      Uploader une image →
                    </SecondaryButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`group relative bg-gray-700 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedMediaId === item.id
                            ? 'border-blue-500 ring-2 ring-blue-500'
                            : 'border-gray-600 hover:border-blue-400'
                        }`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={item.url}
                            alt={item.alt_text || item.filename}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                        <div className="p-2 bg-gray-800">
                          <p className="text-xs text-gray-300 truncate">
                            {item.filename}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                // Onglet Upload
                <div className="max-w-xl mx-auto">
                  {uploadError && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-400 text-sm">{uploadError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="media-file-input">Fichier *</Label>
                      <input
                        type="file"
                        id="media-file-input"
                        accept="image/*"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="media-alt-text">Texte alternatif</Label>
                      <input
                        type="text"
                        id="media-alt-text"
                        placeholder="Description de l'image"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <PrimaryButton
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? 'Upload en cours...' : 'Uploader et sélectionner'}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
