"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type StatutDemande = "en_attente" | "en_cours" | "resolu";

export async function creerDemande(
  sujet: string,
  description: string,
  aoId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Récupère l'entreprise_id de l'utilisateur
  const { data: utilisateur, error: userError } = await supabase
    .from("utilisateurs")
    .select("entreprise_id")
    .eq("id", user.id)
    .single();

  if (userError || !utilisateur) {
    return { error: "Impossible de récupérer l'entreprise" };
  }

  const { data, error } = await supabase
    .from("demandes_experts")
    .insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      ao_id: aoId ?? null,
      sujet,
      description,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assistance-experts");
  return { data };
}

export async function listerMesDemandes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes_experts")
    .select(
      `
      id,
      sujet,
      description,
      statut,
      created_at,
      ao_id,
      expert_id,
      staff_safqa:expert_id ( nom )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function listerDemandesStaff() {
  const supabase = await createClient();

  // RLS gère déjà le filtre : en_attente non assignées + celles assignées à moi + tout si super_admin
  const { data, error } = await supabase
    .from("demandes_experts")
    .select(
      `
      id,
      sujet,
      description,
      statut,
      created_at,
      expert_id,
      entreprises:entreprise_id ( raison_sociale )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function prendreDemandeEnCharge(demandeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data, error } = await supabase
    .from("demandes_experts")
    .update({
      expert_id: user.id,
      statut: "en_cours",
    })
    .eq("id", demandeId)
    .eq("statut", "en_attente") // évite qu'on prenne une demande déjà prise
    .is("expert_id", null)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assistance-experts");
  return { data };
}

export async function changerStatut(demandeId: string, statut: StatutDemande) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes_experts")
    .update({ statut })
    .eq("id", demandeId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assistance-experts");
  return { data };
}

export async function listerDemandesActives() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes_experts")
    .select(
      `
      id,
      sujet,
      description,
      statut,
      created_at,
      expert_id,
      entreprises:entreprise_id ( raison_sociale )
    `
    )
    .neq("statut", "resolu")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function listerHistorique() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("demandes_experts")
    .select(
      `
      id,
      sujet,
      description,
      statut,
      created_at,
      expert_id,
      entreprises:entreprise_id ( raison_sociale )
    `
    )
    .eq("statut", "resolu")
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}