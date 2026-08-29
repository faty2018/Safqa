"use client";

import { useState } from "react";
import { ExpertDemandeDetail } from "./ExpertDemandeDetail";
import { STATUT_LABELS, STATUT_STYLES } from "@/lib/statuts-demande";
import { Demande } from "@/app/types/assistance-experts";

export function DemandesStaffTable({
  demandesInitiales,
  emptyMessage,
}: {
  demandesInitiales: Demande[];
  emptyMessage: string;
}) {
  const [demandes, setDemandes] = useState<Demande[]>(demandesInitiales);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<Demande | null>(
    null
  );

  function majDemande(demandeMaj: Demande) {
    setDemandes((prev) =>
      prev
        .map((d) => (d.id === demandeMaj.id ? { ...d, ...demandeMaj } : d))
        // si le statut passe à resolu, on la retire de la vue "actives"
        .filter((d) => d.statut !== "resolu" || demandesInitiales.some((i) => i.id === d.id && i.statut === "resolu"))
    );
    setDemandeSelectionnee((prev) =>
      prev && prev.id === demandeMaj.id ? { ...prev, ...demandeMaj } : prev
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-white">
      {demandes.length === 0 ? (
        <p className="p-4 text-sm text-[var(--color-muted)]">{emptyMessage}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
              <th className="px-4 py-3 font-medium">Sujet</th>
              <th className="px-4 py-3 font-medium">Entreprise</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr
                key={d.id}
                onClick={() => setDemandeSelectionnee(d)}
                className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-light)]"
              >
                <td className="px-4 py-3">{d.sujet}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {d.entreprises?.raison_sociale ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLES[d.statut]}`}
                  >
                    {STATUT_LABELS[d.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {demandeSelectionnee && (
        <ExpertDemandeDetail
          demande={demandeSelectionnee}
          onClose={() => setDemandeSelectionnee(null)}
          onUpdate={majDemande}
        />
      )}
    </div>
  );
}
