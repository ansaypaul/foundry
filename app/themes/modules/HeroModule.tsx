import type { HeroModuleConfig } from '@/lib/db/theme-types';

interface Props {
  siteName: string;
  siteTagline?: string;
  config: HeroModuleConfig;
}

export default function HeroModule({ siteName, siteTagline, config }: Props) {
  const {
    showTitle = true,
    showTagline = true,
    centered = true,
  } = config;

  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      {showTitle && (
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ 
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          Bienvenue sur {siteName}
        </h1>
      )}
      {showTagline && siteTagline && (
        <p 
          className="text-xl"
          style={{ color: 'var(--color-text)', opacity: 0.8 }}
        >
          {siteTagline}
        </p>
      )}
    </div>
  );
}
