export default function AssistanceExpertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Assistance experts</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Gérez vos demandes d&apos;accompagnement sur les marchés publics.
          </p>
        </div>
        <button className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white">
          + Nouvelle demande
        </button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm text-[var(--color-muted)]">
          TODO: table des demandes — statut (en attente / en cours / résolu), expert assigné.
        </p>
      </div>
    </div>
  );
}
