'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Input, Label, Textarea, PrimaryButton, SecondaryButton } from './FormComponents';

interface Props {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageEditPopup({ editor, isOpen, onClose }: Props) {
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [width, setWidth] = useState('');

  useEffect(() => {
    if (isOpen) {
      const { src, alt: currentAlt, title: currentTitle, 'data-caption': currentCaption, width: currentWidth } = editor.getAttributes('image');
      setAlt(currentAlt || '');
      setTitle(currentTitle || '');
      setCaption(currentCaption || '');
      setWidth(currentWidth || '');
    }
  }, [isOpen, editor]);

  function handleSave() {
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        alt,
        title,
        'data-caption': caption,
        ...(width && { width }),
      })
      .run();
    onClose();
  }

  function handleRemove() {
    if (confirm('Supprimer cette image ?')) {
      editor.chain().focus().deleteSelection().run();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Modifier l'image</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="img-alt">Texte alternatif</Label>
            <Input
              id="img-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Description de l'image"
            />
            <p className="text-xs text-gray-500 mt-1">Pour l'accessibilité et le SEO</p>
          </div>

          <div>
            <Label htmlFor="img-title">Titre</Label>
            <Input
              id="img-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'image (apparaît au survol)"
            />
          </div>

          <div>
            <Label htmlFor="img-caption">Légende</Label>
            <Textarea
              id="img-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Légende affichée sous l'image"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="img-width">Largeur (optionnel)</Label>
            <Input
              id="img-width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="Ex: 500px ou 100%"
            />
            <p className="text-xs text-gray-500 mt-1">Laissez vide pour la taille originale</p>
          </div>
        </div>

        <div className="flex justify-between gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={handleRemove}
            className="px-4 py-2 text-red-500 hover:text-red-400 font-medium transition-colors"
          >
            🗑️ Supprimer
          </button>
          
          <div className="flex gap-3">
            <SecondaryButton onClick={onClose}>
              Annuler
            </SecondaryButton>
            <PrimaryButton onClick={handleSave}>
              Enregistrer
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
