"use client";

import { useState, useTransition } from "react";
import { creerDemande } from "@/lib/actions/demandes-experts";

export function NouvelleDemandeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (demande: any) => void;
}) {
  const [sujet, setSujet] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!sujet.trim() || !description.trim()) {
      setErreur("Le sujet et la description sont requis.");
      return;
    }

    setErreur(null);
    startTransition(async () => {
      const { data, error } = await creerDemande(sujet, description);
      if (error) {
        setErreur(error);
        return;
      }
      onCreated(data);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Nouvelle demande</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Sujet</label>
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex. Révision de notre réponse pour l'AO..."
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Détaillez votre besoin..."
              className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            />
          </div>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Envoi..." : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}