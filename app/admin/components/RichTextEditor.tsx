'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import ImagePickerModal from './ImagePickerModal';
import ImageEditPopup from './ImageEditPopup';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  siteId?: string; // Pour l'upload des images
}

export default function RichTextEditor({ content, onChange, placeholder = 'Commencez à écrire...', siteId }: Props) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageEditOpen, setIsImageEditOpen] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-700',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'cursor-pointer hover:opacity-80 transition-opacity',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full h-full absolute top-0 left-0 rounded-lg',
        },
        addPasteHandler: false,
      }).extend({
        addNodeView() {
          return ({ node }) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative w-full aspect-video my-4';
            
            const iframe = document.createElement('iframe');
            iframe.className = 'w-full h-full absolute top-0 left-0 rounded-lg';
            iframe.src = node.attrs.src;
            iframe.allowFullscreen = true;
            iframe.loading = 'lazy';
            
            wrapper.appendChild(iframe);
            
            return {
              dom: wrapper,
            };
          };
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[300px] p-4 bg-gray-700 text-white rounded-lg [&_*]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white [&_em]:text-white [&_p]:text-white [&_li]:text-white [&_blockquote]:text-gray-300 [&_code]:text-gray-200',
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        if (node.type.name === 'image') {
          // Sélectionner l'image et ouvrir le popup
          editor?.commands.setNodeSelection(nodePos);
          setIsImageEditOpen(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Mettre à jour le contenu si il change de l'extérieur
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Gérer le basculement entre mode visuel et HTML
  function toggleHtmlMode() {
    if (isHtmlMode) {
      // Passer du mode HTML au mode visuel
      if (editor) {
        editor.commands.setContent(htmlContent);
        onChange(htmlContent);
      }
      setIsHtmlMode(false);
    } else {
      // Passer du mode visuel au mode HTML
      if (editor) {
        setHtmlContent(editor.getHTML());
      }
      setIsHtmlMode(true);
    }
  }

  function handleHtmlChange(newHtml: string) {
    setHtmlContent(newHtml);
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-600 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Gras (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italique (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Barré"
        >
          <s>S</s>
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Titre H2"
        >
          H2
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Titre H3"
        >
          H3
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Liste à puces"
        >
          • Liste
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Liste numérotée"
        >
          1. Liste
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Citation"
        >
          " "
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code"
        >
          {'</>'}
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL du lien:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title="Ajouter un lien"
        >
          🔗
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setIsImageModalOpen(true)}
          title="Ajouter une image"
          disabled={!siteId}
        >
          🖼️
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL de la vidéo YouTube:');
            if (url) {
              editor.chain().focus().setYoutubeVideo({ src: url }).run();
            }
          }}
          title="Ajouter une vidéo YouTube"
        >
          🎥
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne horizontale"
        >
          —
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler (Ctrl+Z)"
        >
          ↶
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refaire (Ctrl+Y)"
        >
          ↷
        </ToolbarButton>

        <div className="w-px bg-gray-600 mx-1" />

        <ToolbarButton
          onClick={toggleHtmlMode}
          active={isHtmlMode}
          title={isHtmlMode ? "Mode visuel" : "Mode HTML"}
        >
          {isHtmlMode ? '👁️' : '</>'}
        </ToolbarButton>
      </div>

      {/* Editor ou HTML */}
      {isHtmlMode ? (
        <textarea
          value={htmlContent}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="w-full min-h-[300px] p-4 bg-gray-700 text-white font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Code HTML..."
        />
      ) : (
        <EditorContent editor={editor} />
      )}
      
      {/* Modal de sélection d'image */}
      {siteId && (
        <ImagePickerModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSelect={(media, imageProps) => {
            editor?.chain().focus().setImage({
              src: media.url,
              alt: imageProps.alt || media.alt_text || '',
              title: imageProps.title || media.title || '',
            }).run();
          }}
          siteId={siteId}
        />
      )}
      
      {/* Popup d'édition d'image */}
      {editor && (
        <ImageEditPopup
          editor={editor}
          isOpen={isImageEditOpen}
          onClose={() => setIsImageEditOpen(false)}
        />
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 text-sm rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
