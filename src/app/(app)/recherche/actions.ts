"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSuivi(aoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("utilisateurs")
    .select("entreprise_id")
    .eq("id", user.id)
    .single();

  if (!profile?.entreprise_id) return { error: "Entreprise introuvable" };

  const { data: existant } = await supabase
    .from("ao_suivis")
    .select("ao_id")
    .eq("ao_id", aoId)
    .eq("entreprise_id", profile.entreprise_id)
    .maybeSingle();

  if (existant) {
    await supabase
      .from("ao_suivis")
      .delete()
      .eq("ao_id", aoId)
      .eq("entreprise_id", profile.entreprise_id);
  } else {
    await supabase
      .from("ao_suivis")
      .insert({ ao_id: aoId, entreprise_id: profile.entreprise_id });
  }

  revalidatePath("/recherche");
  revalidatePath("/dashboard");

  return { following: !existant };
}