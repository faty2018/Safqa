"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleSuivi } from "@/app/(app)/recherche/actions";

export function FollowButton({
  aoId,
  initialFollowing,
}: {
  aoId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setFollowing((f) => !f); // optimiste
        startTransition(async () => {
          const result = await toggleSuivi(aoId);
          if (result?.following !== undefined) setFollowing(result.following);
        });
      }}
      aria-label={following ? "Ne plus suivre" : "Suivre cet appel d'offres"}
      className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
        following
          ? "text-[var(--color-navy)]"
          : "text-[var(--color-muted)] hover:text-[var(--color-navy)]"
      }`}
    >
      <Bookmark size={16} fill={following ? "currentColor" : "none"} />
    </button>
  );
}