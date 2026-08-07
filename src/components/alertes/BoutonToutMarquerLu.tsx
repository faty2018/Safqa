"use client";

import { useTransition } from "react";
import { marquerToutesLues } from "@/lib/actions/notifications";

export function BoutonToutMarquerLu() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => marquerToutesLues())}
      disabled={isPending}
      className="text-sm text-[var(--color-accent)] disabled:opacity-50"
    >
      Tout marquer comme lu
    </button>
  );
}