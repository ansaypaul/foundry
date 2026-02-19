'use client';

import { useState } from 'react';
import SiteMenuClient from './SiteMenuClient';

interface MobileMenuProps {
  siteName: string;
  menuItems: any[];
}

export default function MobileMenu({ siteName, menuItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton burger (mobile uniquement) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-theme-text"
        aria-label="Menu"
      >
        {!isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Menu mobile en overlay */}
      {isOpen && (
        <>
          {/* Backdrop (fond sombre) */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu en slide depuis la droite */}
          <div 
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-50 md:hidden shadow-2xl bg-theme-bg"
            style={{
              transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            {/* Header du menu mobile */}
            <div className="flex items-center justify-between p-4 border-b border-theme-border">
              <h2 className="text-lg font-bold text-theme-text">
                {siteName}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-theme-text"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du menu */}
            <div className="p-4">
              <SiteMenuClient 
                items={menuItems}
                location="header" 
                isMobile={true}
                onClick={() => setIsOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
