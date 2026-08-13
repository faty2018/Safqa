"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { contientContactSuspect } from "@/lib/moderation";

export async function envoyerMessage(demandeId: string, contenu: string) {
  if (contientContactSuspect(contenu)) {
    return {
      error:
        "Message bloqué : merci de ne pas partager de coordonnées personnelles (téléphone, email, WhatsApp...). Tous les échanges doivent rester sur Safqa.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Détection auto : est-ce un membre staff (expert/super_admin) ?
  const { data: staff } = await supabase
    .from("staff_safqa")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const insertPayload = staff
    ? {
        demande_id: demandeId,
        auteur_type: "expert" as const,
        auteur_expert_id: user.id,
        auteur_utilisateur_id: null,
        contenu,
      }
    : {
        demande_id: demandeId,
        auteur_type: "utilisateur" as const,
        auteur_utilisateur_id: user.id,
        auteur_expert_id: null,
        contenu,
      };

  const { data, error } = await supabase
    .from("messages_demande")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assistance-experts");
  return { data };
}

export async function listerMessages(demandeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages_demande")
    .select(
      `
      id,
      auteur_type,
      contenu,
      created_at,
      utilisateurs:auteur_utilisateur_id ( nom ),
      staff_safqa:auteur_expert_id ( nom )
    `
    )
    .eq("demande_id", demandeId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}