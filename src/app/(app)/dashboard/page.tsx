import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: entreprisesCount }, { count: aoCount }, { count: usersCount }, { data: dernieresEntreprises }] =
    await Promise.all([
      supabase.from("entreprises").select("*", { count: "exact", head: true }),
      supabase.from("ao").select("*", { count: "exact", head: true }),
      supabase.from("utilisateurs").select("*", { count: "exact", head: true }),
      supabase
        .from("entreprises")
        .select("id, raison_sociale, ice, date_inscription")
        .order("date_inscription", { ascending: false })
        .limit(5),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Tableau de bord — Admin
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vue d&apos;ensemble des entreprises et appels d&apos;offres suivis sur la plateforme.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Entreprises inscrites
          </p>
          <p className="mt-2 text-2xl font-semibold">{entreprisesCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            AO collectés
          </p>
          <p className="mt-2 text-2xl font-semibold">{aoCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Utilisateurs actifs
          </p>
          <p className="mt-2 text-2xl font-semibold">{usersCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-white p-4">
        <h2 className="font-medium text-[var(--color-navy)]">Dernières entreprises inscrites</h2>
        <div className="mt-3 divide-y divide-[var(--color-border)]">
          {dernieresEntreprises?.length ? (
            dernieresEntreprises.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{e.raison_sociale}</p>
                  <p className="text-xs text-[var(--color-muted)]">ICE {e.ice}</p>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {new Date(e.date_inscription).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))
          ) : (
            <p className="py-2 text-sm text-[var(--color-muted)]">Aucune entreprise inscrite.</p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--color-muted)]">
        TODO: statut entreprise (validation/suspension), plans, demandes d&apos;assistance et
        activité récente nécessitent de nouvelles tables — non branchés pour l&apos;instant.
      </p>
    </div>
  );
}