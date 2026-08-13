"use server";

import { createClient } from "@/lib/supabase/server";

export async function getStatsAdmin() {
  const supabase = await createClient();

  const { count: entreprisesInscrites } = await supabase
    .from("entreprises")
    .select("*", { count: "exact", head: true });

  const { count: aoActifs } = await supabase
    .from("ao")
    .select("*", { count: "exact", head: true })
    .gte("date_limite_remise_plis", new Date().toISOString());

  const { count: demandesEnAttente } = await supabase
    .from("demandes_experts")
    .select("*", { count: "exact", head: true })
    .eq("statut", "en_attente");

  // AO créés sur les 14 derniers jours, groupés par jour
  const quatorzeJoursAvant = new Date();
  quatorzeJoursAvant.setDate(quatorzeJoursAvant.getDate() - 14);

  const { data: aoRecents } = await supabase
    .from("ao")
    .select("created_at")
    .gte("created_at", quatorzeJoursAvant.toISOString());

  const compteParJour: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const cle = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    compteParJour[cle] = 0;
  }
  (aoRecents ?? []).forEach((row) => {
    const cle = new Date(row.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (cle in compteParJour) compteParJour[cle]++;
  });

  const collecteParJour = Object.entries(compteParJour).map(([date, count]) => ({
    date,
    ao: count,
  }));

  // Répartition des demandes experts par statut
  const { data: toutesDemandesRaw } = await supabase
    .from("demandes_experts")
    .select("statut");

  const repartition = { en_attente: 0, en_cours: 0, resolu: 0 };
  (toutesDemandesRaw ?? []).forEach((row) => {
    if (row.statut in repartition) {
      repartition[row.statut as keyof typeof repartition]++;
    }
  });

  const demandesParStatut = [
    { name: "En attente", value: repartition.en_attente },
    { name: "En cours", value: repartition.en_cours },
    { name: "Résolu", value: repartition.resolu },
  ];

  return {
    entreprisesInscrites: entreprisesInscrites ?? 0,
    aoActifs: aoActifs ?? 0,
    demandesEnAttente: demandesEnAttente ?? 0,
    collecteParJour,
    demandesParStatut,
  };
}