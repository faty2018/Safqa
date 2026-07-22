import { createClient } from "@/lib/supabase/server";
import { Calendar, Building2, FileText } from "lucide-react";


export default async function AdminCollectesPage() {
  const supabase = await createClient();

  const { data: collectes,error  } = await supabase
    .from("collectes")
    .select("id, date_collecte, created_at")
    .order("date_collecte", { ascending: false })
    .limit(10);
    console.log("DEBUG collectes:", { collectes, error });

  const collectesAvecAO = await Promise.all(
    (collectes ?? []).map(async (collecte) => {
      const { data: liens } = await supabase
        .from("ao_collectes")
        .select("ao(id, reference, intitule, acheteur_public, lien_source)")
        .eq("collecte_id", collecte.id);

      const aoList = (liens ?? [])
        .map((l: any) => l.ao)
        .filter(Boolean);

      // Groupe par acheteur public
      const parAcheteur = new Map<string, typeof aoList>();
      aoList.forEach((ao: any) => {
        const key = ao.acheteur_public || "Non renseigné";
        if (!parAcheteur.has(key)) parAcheteur.set(key, []);
        parAcheteur.get(key)!.push(ao);
      });

      return {
        ...collecte,
        total: aoList.length,
        acheteurs: Array.from(parAcheteur.entries()).sort((a, b) => b[1].length - a[1].length),
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Historique de collecte
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Vue chronologique des AO collectés, organisés par date et par acheteur public.
      </p>

      <div className="mt-6 space-y-3">
        {collectesAvecAO.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Aucune collecte enregistrée.</p>
        ) : (
          collectesAvecAO.map((collecte) => (
            <details
              key={collecte.id}
              className="group rounded-lg border border-[var(--color-border)] bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-[var(--color-navy)]" />
                  <span className="text-sm font-semibold text-[var(--color-navy)]">
                    Veille du{" "}
                    {new Date(collecte.date_collecte).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span className="rounded-full bg-[var(--color-accent-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-navy)]">
                  {collecte.total} AO · {collecte.acheteurs.length} acheteurs
                </span>
              </summary>

              <div className="border-t border-[var(--color-border)] px-4 py-2">
                {collecte.acheteurs.map(([acheteur, aoList]) => (
                  <details key={acheteur} className="border-b border-[var(--color-border)] py-2 last:border-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-1 select-none">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[var(--color-muted)]" />
                        <span className="text-sm text-[var(--color-navy)]">{acheteur}</span>
                      </div>
                      <span className="text-xs text-[var(--color-muted)]">
                        {aoList.length} AO
                      </span>
                    </summary>

                    <div className="ml-6 mt-1 space-y-1">
                      {aoList.map((ao: any) => (
                        <div
                          key={ao.id}
                          className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-[var(--color-accent-light)]"
                        >
                          <FileText size={12} className="shrink-0 text-[var(--color-muted)]" />
                          <span className="font-mono text-[var(--color-muted)]">
                            {ao.reference}
                          </span>
                          <span className="truncate">{ao.intitule}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}