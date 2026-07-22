"use server";

import { createClient } from "@/lib/supabase/server";

export async function signup(formData: {
  raisonSociale: string;
  ice: string;
  nomAdmin: string;
  emailAdmin: string;
  motDePasse: string;
}) {
  const supabase = await createClient();

  // 1. Créer le compte Auth (email + mot de passe)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.emailAdmin,
    password: formData.motDePasse,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte." };
  }

  // 2. Créer l'entreprise + lier l'admin (fonction SQL atomique)
  const { error: rpcError } = await supabase.rpc("create_entreprise_et_admin", {
    p_raison_sociale: formData.raisonSociale,
    p_ice: formData.ice,
    p_nom_admin: formData.nomAdmin,
    p_email_admin: formData.emailAdmin,
    p_user_id: authData.user.id,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  return { success: true };
}