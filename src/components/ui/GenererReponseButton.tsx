"use client";

import { useState, useTransition } from "react";
import { genererTrameReponse } from "@/lib/actions/reponses";
import { Sparkles, Loader2 } from "lucide-react";

export function GenererReponseButton({ aoId }: { aoId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => genererTrameReponse(aoId))}
      disabled={isPending}
      className="flex items-center gap-2 rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Sparkles size={15} />
      )}
      {isPending ? "Génération en cours..." : "Générer une réponse avec l'IA"}
    </button>
  );
}