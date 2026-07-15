export default function ExpertDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Tableau de bord — Expert
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vos demandes d'assistance en cours et récentes.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Demandes en attente
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Demandes traitées ce mois
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        TODO: brancher sur Supabase.
      </p>
    </div>
  );
}