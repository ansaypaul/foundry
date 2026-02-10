'use client';

import { createContext, useContext } from 'react';

interface Theme {
  id: string;
  key: string;
  name: string;
  layout_type: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          '--color-primary': theme.colors.primary,
          '--color-secondary': theme.colors.secondary,
          '--color-background': theme.colors.background,
          '--color-text': theme.colors.text,
          '--color-accent': theme.colors.accent,
          '--color-border': theme.colors.border,
          '--font-heading': theme.fonts.heading,
          '--font-body': theme.fonts.body,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
