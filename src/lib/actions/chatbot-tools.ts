"use server";

import { createClient } from "@/lib/supabase/server";

async function getEntrepriseId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("utilisateurs")
    .select("entreprise_id")
    .eq("id", user.id)
    .single();

  return data?.entreprise_id ?? null;
}

export async function compterAO(params: {
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("ao")
    .select("id, intitule, montant_estime, date_limite_remise_plis", {
      count: "exact",
    });

  if (params.date_debut) {
    query = query.gte("date_limite_remise_plis", params.date_debut);
  }
  if (params.date_fin) {
    query = query.lte("date_limite_remise_plis", params.date_fin);
  }
  if (params.montant_min) {
    query = query.gte("montant_estime", params.montant_min);
  }
  if (params.montant_max) {
    query = query.lte("montant_estime", params.montant_max);
  }

  const { data, count, error } = await query.limit(10);

  if (error) return { erreur: error.message };

  return {
    total: count ?? 0,
    exemples:
      data?.map((a) => ({
        intitule: a.intitule,
        echeance: a.date_limite_remise_plis,
      })) ?? [],
  };
}

export async function listerMesReponses(params: { statut?: string }) {
  const entrepriseId = await getEntrepriseId();
  if (!entrepriseId) return { erreur: "Entreprise introuvable" };

  const supabase = await createClient();

  let query = supabase
    .from("reponses")
    .select("id, statut, updated_at, ao:ao_id ( intitule )")
    .eq("entreprise_id", entrepriseId);

  if (params.statut) {
    query = query.eq("statut", params.statut);
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) return { erreur: error.message };

  return {
    total: data?.length ?? 0,
    reponses:
      data?.map((r: any) => ({ ao: r.ao?.intitule, statut: r.statut })) ?? [],
  };
}

export async function listerMesDemandesExperts(params: { statut?: string }) {
  const entrepriseId = await getEntrepriseId();
  if (!entrepriseId) return { erreur: "Entreprise introuvable" };

  const supabase = await createClient();

  let query = supabase
    .from("demandes_experts")
    .select("id, sujet, statut, created_at")
    .eq("entreprise_id", entrepriseId);

  if (params.statut) {
    query = query.eq("statut", params.statut);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return { erreur: error.message };

  return {
    total: data?.length ?? 0,
    demandes: data?.map((d) => ({ sujet: d.sujet, statut: d.statut })) ?? [],
  };
}

export async function listerMesAlertes() {
  const entrepriseId = await getEntrepriseId();
  if (!entrepriseId) return { erreur: "Entreprise introuvable" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alertes_criteres")
    .select("id, nom, mots_cles, region, montant_min, montant_max, actif")
    .eq("entreprise_id", entrepriseId);

  if (error) return { erreur: error.message };

  return { total: data?.length ?? 0, criteres: data ?? [] };
}