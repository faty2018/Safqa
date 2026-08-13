import { getStatsAdmin } from "@/lib/actions/admin-dashboard";
import { CollecteChart, DemandesStatutChart } from "@/components/admin/AdminCharts";

export default async function AdminDashboardPage() {
  const stats = await getStatsAdmin();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Tableau de bord — Admin
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vue d&apos;ensemble des entreprises et appels d&apos;offres suivis sur la
        plateforme.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Entreprises inscrites
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {stats.entreprisesInscrites}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            AO actifs
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {stats.aoActifs}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Demandes experts en attente
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {stats.demandesEnAttente}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <CollecteChart data={stats.collecteParJour} />
        <DemandesStatutChart data={stats.demandesParStatut} />
      </div>
    </div>
  );
}