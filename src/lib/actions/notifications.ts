"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { NotificationAlerte } from "@/lib/types";

function mapNotification(row: any): NotificationAlerte {
  return {
    id: row.id,
    utilisateurId: row.utilisateur_id,
    aoId: row.ao_id,
    type: row.type,
    alerteCritereId: row.alerte_critere_id,
    titre: row.titre,
    message: row.message,
    dateLimiteOffre: row.date_limite_offre,   // <-- ajout
    lu: row.lu,
    emailEnvoye: row.email_envoye,
    createdAt: row.created_at,
  };
}

export async function getNotifications(): Promise<NotificationAlerte[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erreur getNotifications:", error);
    return [];
  }
  return (data ?? []).map(mapNotification);
}

export async function getNombreNotificationsNonLues(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("lu", false);

  if (error) {
    console.error("Erreur getNombreNotificationsNonLues:", error);
    return 0;
  }
  return count ?? 0;
}

export async function marquerNotificationLue(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("id", id);

  if (error) {
    console.error("Erreur marquerNotificationLue:", error);
    return { success: false };
  }
  revalidatePath("/alertes");
  return { success: true };
}

export async function marquerToutesLues() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("utilisateur_id", user.id)
    .eq("lu", false);

  if (error) {
    console.error("Erreur marquerToutesLues:", error);
    return { success: false };
  }
  revalidatePath("/alertes");
  return { success: true };
}