"use client";

import { useEffect, useState, useTransition } from "react";
import { listerMessages, envoyerMessage } from "@/lib/actions/messages-demande";
import {
  prendreDemandeEnCharge,
  changerStatut,
} from "@/lib/actions/demandes-experts";
import {
  STATUT_LABELS,
  getStatutSuivant,
  type StatutDemande,
} from "@/lib/statuts-demande";

type Message = {
  id: string;
  auteur_type: "utilisateur" | "expert";
  contenu: string;
  created_at: string;
  utilisateurs: { nom: string } | null;
  staff_safqa: { nom: string } | null;
};

type Demande = {
  id: string;
  sujet: string;
  description: string;
  statut: StatutDemande;
  expert_id: string | null;
  entreprises: { raison_sociale: string } | null;
};

export function ExpertDemandeDetail({
  demande,
  onClose,
  onUpdate,
}: {
  demande: Demande;
  onClose: () => void;
  onUpdate: (d: Demande) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chargement, setChargement] = useState(true);
  const [nouveauMessage, setNouveauMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerMessages(demande.id).then(({ data }) => {
      setMessages(data ?? []);
      setChargement(false);
    });
  }, [demande.id]);

  function handleEnvoyer() {
    if (!nouveauMessage.trim()) return;

    startTransition(async () => {
      const { data, error } = await envoyerMessage(demande.id, nouveauMessage);
      if (error) {
        setErreur(error);
        return;
      }
      setErreur(null);
      const { data: refreshed } = await listerMessages(demande.id);
      setMessages(refreshed ?? []);
      setNouveauMessage("");
    });
  }

  function handlePrendreEnCharge() {
    startTransition(async () => {
      const { data, error } = await prendreDemandeEnCharge(demande.id);
      if (error) {
        setErreur(error);
        return;
      }
      if (data) onUpdate({ ...demande, ...data });
    });
  }

  function handleAvancer() {
    const suivant = getStatutSuivant(demande.statut);
    if (!suivant) return;

    startTransition(async () => {
      const { data, error } = await changerStatut(demande.id, suivant);
      if (error) {
        setErreur(error);
        return;
      }
      if (data) onUpdate({ ...demande, ...data });
    });
  }

  const statutSuivant = getStatutSuivant(demande.statut);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[650px] w-full max-w-lg flex-col rounded-lg bg-white shadow-lg">
        <div className="border-b border-[var(--color-border)] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">{demande.sujet}</h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {demande.entreprises?.raison_sociale ?? "Entreprise inconnue"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-muted)] hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {demande.expert_id === null ? (
              <button
                onClick={handlePrendreEnCharge}
                disabled={isPending}
                className="rounded-md bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Prendre en charge
              </button>
            ) : (
              <>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-accent-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-navy)]">
                  {STATUT_LABELS[demande.statut]}
                </span>
                {statutSuivant && (
                  <button
                    onClick={handleAvancer}
                    disabled={isPending}
                    className="rounded-md bg-[var(--color-navy)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Passer à : {STATUT_LABELS[statutSuivant]} →
                  </button>
                )}
              </>
            )}
          </div>

          {erreur && <p className="mt-2 text-xs text-red-600">{erreur}</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {chargement ? (
            <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Aucun message pour l&apos;instant.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.auteur_type === "utilisateur"
                    ? "bg-[var(--color-accent-light)]"
                    : "ml-auto bg-[var(--color-navy)] text-white"
                }`}
              >
                <p className="mb-1 text-xs font-medium opacity-70">
                  {m.auteur_type === "utilisateur"
                    ? m.utilisateurs?.nom ?? "Entreprise"
                    : m.staff_safqa?.nom ?? "Vous"}
                </p>
                <p>{m.contenu}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 border-t border-[var(--color-border)] p-4">
          <input
            value={nouveauMessage}
            onChange={(e) => setNouveauMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnvoyer()}
            placeholder="Répondre..."
            disabled={demande.expert_id === null}
            className="flex-1 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm disabled:bg-gray-50"
          />
          <button
            onClick={handleEnvoyer}
            disabled={isPending || demande.expert_id === null}
            className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}