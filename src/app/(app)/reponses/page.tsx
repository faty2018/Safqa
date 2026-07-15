export default function ReponsesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Réponses aux appels d&apos;offres</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Suivez l&apos;avancement de vos soumissions.
          </p>
        </div>
        <button className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white">
          + Nouvelle réponse
        </button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm text-[var(--color-muted)]">
          TODO: table des dossiers en cours — statut (brouillon / en révision / soumis),
          échéance, expert assigné. Query sur <code>responses</code> joint à{" "}
          <code>tenders</code>.
        </p>
      </div>
    </div>
  );
}
