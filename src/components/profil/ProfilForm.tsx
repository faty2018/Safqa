"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateProfil as updateProfilExpert } from "@/app/(expert)/expert/profil/actions";
import { updateProfil as updateProfilAdmin } from "@/app/(admin)/admin/parametres-plateforme/action";

export function ProfilForm({
  nom: nomInitial,
  email,
  role,
  updateAction,
}: {
  nom: string;
  email: string;
  role: string;
  updateAction: "expert" | "admin";
}) {
  const [nom, setNom] = useState(nomInitial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const action = updateAction === "expert" ? updateProfilExpert : updateProfilAdmin;
      const result = await action(nom);
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[var(--color-border)] bg-white p-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase text-[var(--color-muted)]">
          Nom complet
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase text-[var(--color-muted)]">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-accent-light)] px-3 py-2 text-sm text-[var(--color-muted)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase text-[var(--color-muted)]">
          Rôle
        </label>
        <input
          type="text"
          value={role}
          disabled
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-accent-light)] px-3 py-2 text-sm text-[var(--color-muted)]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md bg-[var(--color-navy)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {saved ? (
          <>
            <Check size={14} /> Enregistré
          </>
        ) : isPending ? (
          "Enregistrement..."
        ) : (
          "Enregistrer"
        )}
      </button>
    </form>
  );
}