export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <div 
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: '0.5rem',
          padding: '3rem 2rem',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* 404 */}
        <h1 
          style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-heading)',
            marginBottom: '1rem',
            lineHeight: 1
          }}
        >
          404
        </h1>

        {/* Titre */}
        <h2 
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)',
            marginBottom: '1rem'
          }}
        >
          Page introuvable
        </h2>

        {/* Description */}
        <p 
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text)',
            opacity: 0.7,
            marginBottom: '2rem',
            fontFamily: 'var(--font-body)'
          }}
        >
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Bouton retour */}
        <a
          href="/"
          className="hover:opacity-90"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            fontWeight: '600',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            transition: 'opacity 0.2s'
          }}
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
