import { createClient } from "@/lib/supabase/server";
import { Building2, Users } from "lucide-react";

export default async function AdminEntreprisesPage() {
  const supabase = await createClient();

  const { data: entreprises } = await supabase
    .from("entreprises")
    .select("id, raison_sociale, ice, date_inscription, utilisateurs(id)")
    .order("date_inscription", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
            Entreprises
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {entreprises?.length ?? 0} entreprise
            {(entreprises?.length ?? 0) > 1 ? "s" : ""} inscrite
            {(entreprises?.length ?? 0) > 1 ? "s" : ""} sur la plateforme.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {entreprises?.length ? (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-accent-light)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Entreprise</th>
                <th className="px-4 py-3 text-left font-medium">ICE</th>
                <th className="px-4 py-3 text-left font-medium">Utilisateurs</th>
                <th className="px-4 py-3 text-left font-medium">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {entreprises.map((e) => {
                const nbUtilisateurs = Array.isArray(e.utilisateurs)
                  ? e.utilisateurs.length
                  : 0;
                const initiales = e.raison_sociale
                  .split(" ")
                  .slice(0, 2)
                  .map((mot) => mot[0])
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-[var(--color-accent-light)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-semibold text-white">
                          {initiales}
                        </div>
                        <span className="font-medium text-[var(--color-navy)]">
                          {e.raison_sociale}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                      {e.ice}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
                        <Users size={12} />
                        {nbUtilisateurs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {new Date(e.date_inscription).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <Building2 size={32} className="text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              Aucune entreprise inscrite pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}