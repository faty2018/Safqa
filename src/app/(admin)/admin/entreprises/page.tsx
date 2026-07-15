import { createClient } from "@/lib/supabase/server";

export default async function AdminEntreprisesPage() {
  const supabase = await createClient();

  const { data: entreprises } = await supabase
    .from("entreprises")
    .select("id, raison_sociale, ice, date_inscription, utilisateurs(id)")
    .order("date_inscription", { ascending: false });


  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Entreprises</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Liste des entreprises inscrites sur la plateforme.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-accent-light)] text-xs uppercase text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Entreprise</th>
              <th className="px-4 py-3 text-left">ICE</th>
              <th className="px-4 py-3 text-left">Utilisateurs</th>
              <th className="px-4 py-3 text-left">Inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {entreprises?.length ? (
              entreprises.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium">{e.raison_sociale}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{e.ice}</td>
                  <td className="px-4 py-3">{e.utilisateurs?.length ?? 0}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {new Date(e.date_inscription).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-muted)]">
                  Aucune entreprise inscrite.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        TODO: colonnes Plan et Statut (validation/suspension) nécessitent d&apos;ajouter ces
        champs au schéma — pas encore en base.
      </p>
    </div>
  );
}