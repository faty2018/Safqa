import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deriveStatus, type AO } from "@/lib/types";
import { ArrowRight, Bookmark, Building2 } from "lucide-react";
import { NouveauxAOChart } from "@/components/dashboard/NouveauxAOChart";
import { RepartitionSecteursChart } from "@/components/dashboard/RepartitionSecteursChart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entrepriseId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("utilisateurs")
      .select("entreprise_id")
      .eq("id", user.id)
      .single();
    entrepriseId = profile?.entreprise_id ?? null;
  }

  const seDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const trenteDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [
    { count: suivisCount },
    { count: nouveauxCount },
    { data: suivisRecents },
    { count: reponsesEnCours },
    { data: aoRecents30j },
    { data: suivisAvecDomaines },
  ] = await Promise.all([
    entrepriseId
      ? supabase
          .from("ao_suivis")
          .select("*", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("ao")
      .select("*", { count: "exact", head: true })
      .gte("created_at", seDaysAgo),
    entrepriseId
      ? supabase
          .from("ao_suivis")
          .select(
            "date_ajout, ao(id, reference, intitule, acheteur_public, date_limite_remise_plis, lien_source)"
          )
          .eq("entreprise_id", entrepriseId)
          .order("date_ajout", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    entrepriseId
      ? supabase
          .from("reponses")
          .select("*", { count: "exact", head: true })
          .eq("entreprise_id", entrepriseId)
          .eq("statut", "brouillon")
      : Promise.resolve({ count: 0 }),
    supabase
      .from("ao")
      .select("created_at")
      .gte("created_at", trenteDaysAgo),
    entrepriseId
      ? supabase
          .from("ao_suivis")
          .select("ao(ao_domaines(domaines(nom)))")
          .eq("entreprise_id", entrepriseId)
      : Promise.resolve({ data: [] }),
  ]);

  const suivis = (suivisRecents ?? []) as any[];

  // Regroupement des nouveaux AO par jour (30 derniers jours)
  const compteParJour: Record<string, number> = {};
  (aoRecents30j ?? []).forEach((row: any) => {
    const jour = new Date(row.created_at).toISOString().slice(0, 10);
    compteParJour[jour] = (compteParJour[jour] ?? 0) + 1;
  });
  const evolutionData = Object.entries(compteParJour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      count,
    }));

  // Répartition des AO suivis par secteur/domaine
  const compteParSecteur: Record<string, number> = {};
  ((suivisAvecDomaines ?? []) as any[]).forEach((s) => {
    const domaines = s.ao?.ao_domaines ?? [];
    domaines.forEach((d: any) => {
      const nom = d.domaines?.nom ?? "Non catégorisé";
      compteParSecteur[nom] = (compteParSecteur[nom] ?? 0) + 1;
    });
  });
  const secteursData = Object.entries(compteParSecteur).map(([nom, value]) => ({
    nom,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-navy)]">Tableau de bord</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Gérez vos opportunités de marchés publics en temps réel.
          </p>
        </div>
        <Link
          href="/recherche"
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-navy)] px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Voir toutes les opportunités <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Appels d&apos;offres suivis
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {suivisCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Nouveaux AO (7 jours)
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {nouveauxCount ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">Tous secteurs</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs font-medium uppercase text-[var(--color-muted)]">
            Réponses en cours
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
            {reponsesEnCours ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-navy)] bg-[var(--color-navy)] p-4">
          <p className="text-xs font-medium uppercase text-white/70">Alertes non lues</p>
          <p className="mt-2 text-2xl font-semibold text-white">—</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">
            Nouveaux AO collectés (30 derniers jours)
          </h2>
          {evolutionData.length > 0 ? (
            <NouveauxAOChart data={evolutionData} />
          ) : (
            <p className="text-sm text-[var(--color-muted)] py-10 text-center">
              Pas de données sur cette période.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">
            AO suivis par secteur
          </h2>
          {secteursData.length > 0 ? (
            <RepartitionSecteursChart data={secteursData} />
          ) : (
            <p className="text-sm text-[var(--color-muted)] py-10 text-center">
              Aucun AO suivi pour l&apos;instant.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-navy)]">
              Appels d&apos;offres suivis récemment
            </h2>
            <Link
              href="/recherche"
              className="text-xs font-medium text-[var(--color-navy)] hover:underline"
            >
              Tout voir →
            </Link>
          </div>

          {suivis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bookmark size={20} className="mb-2 text-[var(--color-muted)]" />
              <p className="text-sm text-[var(--color-navy)]">
                Vous ne suivez aucun appel d&apos;offres pour l&apos;instant
              </p>
              <Link
                href="/recherche"
                className="mt-2 text-xs font-medium text-[var(--color-navy)] hover:underline"
              >
                Explorer les opportunités
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {suivis.map((s) => {
                const ao = s.ao as AO | null;
                if (!ao) return null;
                const status = deriveStatus(ao);
                return (
                  <div key={ao.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-navy)]">
                        {ao.intitule}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                        <Building2 size={12} />
                        <span className="truncate">{ao.acheteurPublic}</span>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy)]">Alertes récentes</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Le fil d&apos;alertes se branche sur la table <code>alerts</code> — module pas encore
            construit (voir cahier des charges, module 6).
          </p>
        </div>
      </div>
    </div>
  );
}