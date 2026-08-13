import Link from "next/link";
import { listerMesReponses } from "@/lib/actions/reponses";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_revision: "En révision",
  soumis: "Soumis",
};

const STATUT_STYLES: Record<string, string> = {
  brouillon: "bg-gray-100 text-gray-700 border-gray-200",
  en_revision: "bg-amber-50 text-amber-700 border-amber-200",
  soumis: "bg-green-50 text-green-700 border-green-200",
};

export default async function ReponsesPage() {
  const { data: reponses, error } = await listerMesReponses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Réponses aux appels d&apos;offres</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Suivez l&apos;avancement de vos soumissions.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600">Erreur lors du chargement : {error}</p>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-white">
          {!reponses || reponses.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-muted)]">
              Aucune réponse en cours. Générez-en une depuis la fiche d&apos;un
              appel d&apos;offres.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                  <th className="px-4 py-3 font-medium">Appel d&apos;offres</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Échéance</th>
                  <th className="px-4 py-3 font-medium">Dernière modif.</th>
                </tr>
              </thead>
              <tbody>
                {reponses.map((r: any) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-light)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/reponses/${r.id}`}
                        className="font-medium text-[var(--color-navy)] hover:underline"
                      >
                        {r.ao?.intitule ?? "AO inconnu"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          STATUT_STYLES[r.statut] ?? STATUT_STYLES.brouillon
                        }`}
                      >
                        {STATUT_LABELS[r.statut] ?? r.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {r.ao?.date_limite_remise_plis
                        ? new Date(r.ao.date_limite_remise_plis).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {new Date(r.updated_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}