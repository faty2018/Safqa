"use client";

import { useState } from "react";
import { NouvelleDemandeModal } from "../../app/(app)/assistance-experts/NouvelleDemandeModal";
import { DemandeDetail } from "../../app/(app)/assistance-experts/DemandeDetail";

type Demande = {
  id: string;
  sujet: string;
  description: string;
  statut: "en_attente" | "en_cours" | "resolu";
  created_at: string;
  ao_id: string | null;
  expert_id: string | null;
  staff_safqa: { nom: string } | null;
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

export function AssistanceExpertsClient({
  demandesInitiales,
}: {
  demandesInitiales: Demande[];
}) {
  const [demandes, setDemandes] = useState<Demande[]>(demandesInitiales);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<Demande | null>(
    null
  );

  function ajouterDemande(nouvelle: Demande) {
    setDemandes((prev) => [nouvelle, ...prev]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Assistance experts</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Gérez vos demandes d&apos;accompagnement sur les marchés publics.
          </p>
        </div>
        <button
          onClick={() => setModalOuvert(true)}
          className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white"
        >
          + Nouvelle demande
        </button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white">
        {demandes.length === 0 ? (
          <p className="p-4 text-sm text-[var(--color-muted)]">
            Aucune demande pour le moment. Cliquez sur &quot;+ Nouvelle demande&quot;
            pour solliciter un expert.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
                <th className="px-4 py-3 font-medium">Sujet</th>
                <th className="px-4 py-3 font-medium">Expert</th>
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
                    {d.staff_safqa?.nom ?? "Non assigné"}
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

      {modalOuvert && (
        <NouvelleDemandeModal
          onClose={() => setModalOuvert(false)}
          onCreated={(demande) => {
            ajouterDemande(demande);
            setModalOuvert(false);
          }}
        />
      )}

      {demandeSelectionnee && (
        <DemandeDetail
          demande={demandeSelectionnee}
          onClose={() => setDemandeSelectionnee(null)}
        />
      )}
    </div>
  );
}