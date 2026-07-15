export default function AnalyseIAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analyse IA</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Correspondance automatique entre votre profil et les appels d&apos;offres.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <aside className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Mon profil IA</h2>
          <p className="text-sm text-[var(--color-muted)]">
            TODO: secteurs, régions, taille de marché, mots-clés — édités dans Paramètres.
          </p>
        </aside>

        <section className="col-span-3 space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            TODO: liste des marchés analysés, triée par score de pertinence. Le score et la
            justification viennent du service d&apos;analyse (LangChain/RAG côté backend) — cette
            page ne fait qu&apos;afficher le résultat.
          </p>
        </section>
      </div>
    </div>
  );
}
