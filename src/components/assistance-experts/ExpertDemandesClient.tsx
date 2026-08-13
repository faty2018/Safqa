"use client";

import { useState } from "react";
import { ExpertDemandeDetail } from "./ExpertDemandeDetail";

type Demande = {
  id: string;
  sujet: string;
  description: string;
  statut: "en_attente" | "en_cours" | "resolu";
  created_at: string;
  expert_id: string | null;
  entreprises: { raison_sociale: string } | null;
};

const STATUT_LABELS: Record<Demande["statut"], string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  resolu: "Résolu",
};

const STATUT_STYLES: Record<Demande["statut"], string> = {
  en_attente: "bg-amber-50 text-amber-700 border-amber-200",
  en_cours: "bg-blue-50 text-blue-700 border-blue-200",
  resolu: "bg-green-50 text-green-700 border-green-200",
};

type Filtre = "toutes" | "en_attente" | "les_miennes";

export function ExpertDemandesClient({
  demandesInitiales,
}: {
  demandesInitiales: Demande[];
}) {
  const [demandes, setDemandes] = useState<Demande[]>(demandesInitiales);
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<Demande | null>(
    null
  );

  function majDemande(demandeMaj: Demande) {
    setDemandes((prev) =>
      prev.map((d) => (d.id === demandeMaj.id ? { ...d, ...demandeMaj } : d))
    );
    setDemandeSelectionnee((prev) =>
      prev && prev.id === demandeMaj.id ? { ...prev, ...demandeMaj } : prev
    );
  }

  const demandesFiltrees = demandes.filter((d) => {
    if (filtre === "en_attente") return d.statut === "en_attente";
    if (filtre === "les_miennes") return d.expert_id !== null;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Demandes d&apos;assistance</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Demandes en attente ou en cours de traitement.
        </p>
      </div>

      <div className="flex gap-2">
        {(["toutes", "en_attente", "les_miennes"] as Filtre[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filtre === f
                ? "bg-[var(--color-navy)] text-white"
                : "bg-white text-[var(--color-muted)] border border-[var(--color-border)]"
            }`}
          >
            {f === "toutes"
              ? "Toutes"
              : f === "en_attente"
                ? "En attente"
                : "Mes demandes"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white">
        {demandesFiltrees.length === 0 ? (
          <p className="p-4 text-sm text-[var(--color-muted)]">
            Aucune demande dans cette vue.
          </p>
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
              {demandesFiltrees.map((d) => (
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
      </div>

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