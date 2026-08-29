import { createClient } from "@/lib/supabase/server";
import { Headset } from "lucide-react";

export default async function AdminAssistanceExpertsPage() {
  const supabase = await createClient();

  const { data: experts } = await supabase
    .from("staff_safqa")
    .select("id, nom, email, role")
    .eq("role", "expert")
    .order("nom");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Assistance experts
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Gestion des experts et affectation des demandes d&apos;assistance.
      </p>

      <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">
          Experts Safqa ({experts?.length ?? 0})
        </h2>
        {experts?.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-md border border-[var(--color-border)] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-xs font-medium text-white">
                  {e.nom
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-navy)]">
                    {e.nom}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{e.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Headset size={20} className="mb-2 text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              Aucun expert enregistré pour l&apos;instant.
            </p>
          </div>
        )}
      </div>

      
    </div>
  );
}