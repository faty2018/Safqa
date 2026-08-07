"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AlerteCritere } from "@/lib/types";

function mapCritere(row: any): AlerteCritere {
  return {
    id: row.id,
    entrepriseId: row.entreprise_id,
    utilisateurId: row.utilisateur_id,
    nom: row.nom,
    motsCles: row.mots_cles ?? [],
    domaineIds: row.domaine_ids ?? [],
    montantMin: row.montant_min,
    montantMax: row.montant_max,
    canal: row.canal,
    actif: row.actif,
    createdAt: row.created_at,
  };
}

export async function getCriteres(): Promise<AlerteCritere[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("alertes_criteres")
    .select("*")
    .eq("utilisateur_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur getCriteres:", error);
    return [];
  }
  return (data ?? []).map(mapCritere);
}

export async function getDomaines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("domaines")
    .select("id, nom")
    .order("nom");

  if (error) {
    console.error("Erreur getDomaines:", error);
    return [];
  }
  return data ?? [];
}

type CriterePayload = {
  nom: string;
  motsCles: string[];
  domaineIds: string[];
  montantMin: number | null;
  montantMax: number | null;
  canal: "email" | "inapp" | "email_et_inapp";
};

export async function creerCritere(payload: CriterePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("utilisateurs")
    .select("entreprise_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profil introuvable" };

  const { error } = await supabase.from("alertes_criteres").insert({
    entreprise_id: profile.entreprise_id,
    utilisateur_id: user.id,
    nom: payload.nom,
    mots_cles: payload.motsCles,
    domaine_ids: payload.domaineIds,
    montant_min: payload.montantMin,
    montant_max: payload.montantMax,
    canal: payload.canal,
    actif: true,
  });

  if (error) {
    console.error("Erreur creerCritere:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/parametres");
  return { success: true };
}

export async function toggleActifCritere(id: string, actif: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("alertes_criteres")
    .update({ actif })
    .eq("id", id);

  if (error) {
    console.error("Erreur toggleActifCritere:", error);
    return { success: false };
  }
  revalidatePath("/parametres");
  return { success: true };
}

export async function supprimerCritere(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("alertes_criteres").delete().eq("id", id);

  if (error) {
    console.error("Erreur supprimerCritere:", error);
    return { success: false };
  }
  revalidatePath("/parametres");
  return { success: true };
}