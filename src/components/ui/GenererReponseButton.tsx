"use client";

import { useState, useTransition } from "react";
import { genererTrameReponse } from "@/lib/actions/reponses";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

export function GenererReponseButton({ aoId }: { aoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  function lancerGeneration(forcer = false) {
    setErreur(null);
    startTransition(async () => {
      const res = await genererTrameReponse(aoId, forcer);

      if (res?.existeDeja) {
        const confirmer = confirm(
          "Une réponse existe déjà pour cet AO. La régénérer écrasera le contenu actuel. Continuer ?"
        );
        if (confirmer) {
          lancerGeneration(true);
        }
        return;
      }

      if (res?.error) {
        setErreur(res.error);
        return;
      }

      if (res?.reponseId) {
        router.push(`/reponses/${res.reponseId}`);
      }
    });
  }

  return (
    <div>
      <button
        onClick={() => lancerGeneration(false)}
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
      {erreur && <p className="text-sm text-red-600 mt-2">{erreur}</p>}
    </div>
  );
}