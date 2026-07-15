export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Tableau de bord — Admin
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vue d'ensemble des entreprises et appels d'offres suivis sur la plateforme.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Entreprises inscrites
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            AO actifs
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Demandes experts en attente
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        TODO: brancher sur Supabase (entreprises, ao, staff_safqa).
      </p>
    </div>
  );
}