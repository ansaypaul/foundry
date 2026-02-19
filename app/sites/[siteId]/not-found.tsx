export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <div className="bg-theme-bg rounded-lg px-8 py-12 border border-theme-border">
        {/* 404 */}
        <h1 className="text-[6rem] font-bold text-primary font-heading mb-4 leading-none">
          404
        </h1>

        {/* Titre */}
        <h2 className="text-[2rem] font-semibold text-theme-text font-heading mb-4">
          Page introuvable
        </h2>

        {/* Description */}
        <p className="text-lg text-theme-text opacity-70 mb-8 font-body">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Bouton retour */}
        <a
          href="/"
          className="inline-block py-3 px-8 bg-primary text-white font-semibold rounded-md no-underline font-body transition-opacity hover:opacity-90"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
