import { createClient } from "@/lib/supabase/server";

export default async function ExpertDashboardPage() {
  const supabase = await createClient();

  const { count: countEnAttente } = await supabase
    .from("demandes_experts")
    .select("*", { count: "exact", head: true })
    .eq("statut", "en_attente");

  const { count: countEnCours } = await supabase
    .from("demandes_experts")
    .select("*", { count: "exact", head: true })
    .eq("statut", "en_cours");

  const { count: countResolues } = await supabase
    .from("demandes_experts")
    .select("*", { count: "exact", head: true })
    .eq("statut", "resolu");

  const { data: recentes } = await supabase
    .from("demandes_experts")
    .select("id, sujet, statut, created_at, entreprises:entreprise_id ( raison_sociale )")
    .neq("statut", "resolu")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Tableau de bord
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vue d&apos;ensemble de l&apos;assistance experts.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">En attente</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {countEnAttente?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">En cours</p>
          <p className="mt-1 text-2xl font-semibold text-blue-700">
            {countEnCours?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Résolues</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">
            {countResolues?? 0}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Demandes récentes</h2>
        {!recentes || recentes.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Aucune demande active.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentes.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 text-sm last:border-0"
              >
                <span>{d.sujet}</span>
                <span className="text-[var(--color-muted)]">
                  {d.entreprises?.raison_sociale ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}