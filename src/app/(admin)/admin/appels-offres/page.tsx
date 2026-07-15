import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deriveStatus, type AO } from "@/lib/types";

export default async function AdminAppelsOffresPage() {
  const supabase = await createClient();

  const { data: aoList } = await supabase
    .from("ao")
    .select(
      "id, reference, intitule, acheteur_public, montant_estime, date_limite_remise_plis, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: totalCount } = await supabase
    .from("ao")
    .select("*", { count: "exact", head: true });

  // Répartition par catégorie (via ao_domaines -> domaines -> categories)
  const { data: repartition } = await supabase
    .from("ao_domaines")
    .select("domaines(categorie_id, categories(nom))");

  const compteParCategorie = new Map<string, number>();
  repartition?.forEach((row: any) => {
    const nomCategorie = row.domaines?.categories?.nom ?? "Autres";
    compteParCategorie.set(nomCategorie, (compteParCategorie.get(nomCategorie) ?? 0) + 1);
  });
  const repartitionTriee = Array.from(compteParCategorie.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Appels d&apos;offres</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Supervision des AO collectés depuis marchespublics.gov.ma.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Total collectés
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Répartition par catégorie
          </h2>
          <div className="mt-2 space-y-1">
            {repartitionTriee.length ? (
              repartitionTriee.map(([nom, count]) => (
                <div key={nom} className="flex justify-between text-sm">
                  <span>{nom}</span>
                  <span className="text-[var(--color-muted)]">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-muted)]">Aucune donnée.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-accent-light)] text-xs uppercase text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Référence</th>
              <th className="px-4 py-3 text-left">Intitulé</th>
              <th className="px-4 py-3 text-left">Acheteur public</th>
              <th className="px-4 py-3 text-left">Montant</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {aoList?.length ? (
              aoList.map((row) => {
                const ao: AO = {
                  id: row.id,
                  reference: row.reference,
                  intitule: row.intitule,
                  objet: null,
                  acheteurPublic: row.acheteur_public,
                  montantEstime: row.montant_estime,
                  dateLimiteRemisePlis: row.date_limite_remise_plis,
                  lienSource: null,
                  createdAt: row.created_at,
                };
                return (
                  <tr key={ao.id}>
                    <td className="px-4 py-3 font-mono text-xs">{ao.reference}</td>
                    <td className="px-4 py-3 font-medium">{ao.intitule}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{ao.acheteurPublic}</td>
                    <td className="px-4 py-3">
                      {ao.montantEstime
                        ? `${ao.montantEstime.toLocaleString("fr-FR")} MAD`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={deriveStatus(ao)} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-muted)]">
                  Aucun AO collecté.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        TODO: suivi de synchronisation (dernière sync, erreurs de collecte) nécessite une table
        dédiée — non branché pour l&apos;instant.
      </p>
    </div>
  );
}