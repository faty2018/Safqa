"use server";

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function genererTrameReponse(
  aoId: string,
  forcerRegeneration = false,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient ?? (await createClient());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("utilisateurs")
    .select("entreprise_id, entreprises(raison_sociale)")
    .eq("id", user.id)
    .single();

  if (!profile?.entreprise_id) return { error: "Entreprise introuvable" };

  if (!forcerRegeneration) {
    const { data: existante } = await supabase
      .from("reponses")
      .select("id, statut")
      .eq("ao_id", aoId)
      .eq("entreprise_id", profile.entreprise_id)
      .maybeSingle();

    if (existante) {
      return { existeDeja: true, reponseId: existante.id };
    }
  }

  const { data: ao } = await supabase
    .from("ao")
    .select("reference, intitule, objet, acheteur_public, analyse_json, analyse_resume")
    .eq("id", aoId)
    .single();

  if (!ao) return { error: "AO introuvable" };

  const entreprise = Array.isArray(profile.entreprises)
    ? profile.entreprises[0]
    : profile.entreprises;

  const analyse = ao.analyse_json as any;

  const { data: entrepriseProfil } = await supabase
    .from("entreprise_profils")
    .select("*")
    .eq("entreprise_id", profile.entreprise_id)
    .maybeSingle();

  const prompt = `Tu es un expert en rédaction de réponses aux appels d'offres publics marocains.

Marché : ${ao.intitule}
Acheteur : ${ao.acheteur_public}
Résumé : ${ao.analyse_resume ?? ""}
Exigences clés : ${(analyse?.exigences_cles ?? []).join("; ")}
Délai d'exécution demandé : ${analyse?.delai_execution ?? "Non précisé"}
Montant estimé du marché : ${analyse?.montant_estime ?? "Non précisé"}

Entreprise candidate : ${entreprise?.raison_sociale}
Description de l'activité : ${entrepriseProfil?.description ?? "Non renseignée"}
Secteurs d'activité : ${entrepriseProfil?.secteurs_activite?.join(", ") ?? "Non renseignés"}
Effectif : ${entrepriseProfil?.effectif ?? "Non renseigné"}
Années d'expérience : ${entrepriseProfil?.annees_experience ?? "Non renseignées"}
Moyens matériels disponibles : ${entrepriseProfil?.moyens_materiels ?? "Non renseignés"}
Certifications : ${entrepriseProfil?.certifications?.join(", ") ?? "Aucune renseignée"}
Références de marchés similaires : ${JSON.stringify(entrepriseProfil?.references_marches ?? [])}

RÈGLE ABSOLUE : n'invente aucun fait sur l'entreprise (pas de chiffres, pas de matériel, pas d'expérience) qui n'est pas explicitement fourni ci-dessus. Si une information est marquée "Non renseignée" ou absente, écris "[À compléter par l'entreprise]" dans la section concernée au lieu de généraliser ou d'inventer.

Génère une trame de réponse structurée. Réponds UNIQUEMENT en JSON valide :
{
  "sections": [
    { "titre": "...", "contenu": "..." }
  ]
}

Sections : Présentation de l'entreprise, Compréhension du besoin, Méthodologie proposée, Moyens humains et matériels mobilisés, Références similaires, Planning d'exécution.`;

  let trame;
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "Tu réponds uniquement en JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return { error: "Réponse vide de l'IA, réessayez" };

    trame = JSON.parse(content);
  } catch (err) {
    console.error("Erreur génération Groq:", err);
    return { error: "Échec de la génération IA, réessayez dans quelques instants" };
  }

  const { data: reponse, error } = await supabase
    .from("reponses")
    .upsert(
      {
        ao_id: aoId,
        entreprise_id: profile.entreprise_id,
        trame_json: trame,
        statut: "brouillon",
        genere_le: new Date().toISOString(),
      },
      { onConflict: "ao_id,entreprise_id" }
    )
    .select("id")
    .single();

  if (error) return { error: error.message };

  return { reponseId: reponse.id };
}

export async function sauvegarderReponse(reponseId: string, trameJson: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("reponses")
    .update({
      trame_json: trameJson,
      statut: "brouillon",
      modifie_le: new Date().toISOString(),
    })
    .eq("id", reponseId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function listerMesReponses() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reponses")
    .select(
      `
      id,
      statut,
      updated_at,
      ao_id,
      ao:ao_id ( intitule, date_limite_remise_plis )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}



export async function genererTrameReponseMobile(aoId: string, forcerRegeneration = false) {
  const supabase = SupabaseClient ?? (await createClient());
  // 1. Récupérer le jeton JWT de la session active
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("Utilisateur non connecté sur le mobile");
  }

  // 2. Envoyer la requête HTTP avec le token dans le header Authorization
  const response = await fetch('https://votre-site-web.com/api/generer-reponse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // <--- FIX CRUCIAL POUR LE 401
    },
    body: JSON.stringify({ aoId, forcerRegeneration }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || 'Erreur lors de la génération');
  }

  return json; // Renvoie { reponseId: '...' } ou { existeDeja: true, reponseId: '...' }
}