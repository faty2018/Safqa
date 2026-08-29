"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfil(nom: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("staff_safqa")
    .update({ nom })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/expert/profil");
  return { success: true };
}