"use client";

import { useEffect, useState, useTransition } from "react";
import { listerMessages, envoyerMessage } from "@/lib/actions/messages-demande";

type Message = {
  id: string;
  auteur_type: "utilisateur" | "expert";
  contenu: string;
  created_at: string;
  utilisateurs: { nom: string } | null;
  staff_safqa: { nom: string } | null;
};

export function DemandeDetail({
  demande,
  onClose,
}: {
  demande: { id: string; sujet: string; description: string; statut: string };
  onClose: () => void;
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

    const interval = setInterval(() => {
      listerMessages(demande.id).then(({ data }) => {
        setMessages(data ?? []);
      });
    }, 7000);

    return () => clearInterval(interval);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[600px] w-full max-w-lg flex-col rounded-lg bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-4">
          <div>
            <h2 className="font-semibold">{demande.sujet}</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {demande.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-black"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {chargement ? (
            <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Aucun message pour l&apos;instant. Un expert vous répondra bientôt.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.auteur_type === "expert"
                    ? "bg-[var(--color-accent-light)]"
                    : "ml-auto bg-[var(--color-navy)] text-white"
                }`}
              >
                <p className="mb-1 text-xs font-medium opacity-70">
                  {m.auteur_type === "expert"
                    ? m.staff_safqa?.nom ?? "Expert"
                    : m.utilisateurs?.nom ?? "Vous"}
                </p>
                <p>{m.contenu}</p>
              </div>
            ))
          )}
        </div>

        {erreur && (
          <p className="border-t border-[var(--color-border)] px-4 pt-2 text-xs text-red-600">
            {erreur}
          </p>
        )}

        <div className="flex gap-2 border-t border-[var(--color-border)] p-4">
          <input
            value={nouveauMessage}
            onChange={(e) => setNouveauMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnvoyer()}
            placeholder="Écrire un message..."
            className="flex-1 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <button
            onClick={handleEnvoyer}
            disabled={isPending}
            className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}