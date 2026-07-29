"use server";

import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";
import { redirect } from "next/navigation";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function genererTrameReponse(aoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("utilisateurs")
    .select("entreprise_id, entreprises(raison_sociale)")
    .eq("id", user.id)
    .single();

  if (!profile?.entreprise_id) throw new Error("Entreprise introuvable");

  const { data: ao } = await supabase
    .from("ao")
    .select("reference, intitule, objet, acheteur_public, analyse_json, analyse_resume")
    .eq("id", aoId)
    .single();

  if (!ao) throw new Error("AO introuvable");

  const entreprise = Array.isArray(profile.entreprises)
    ? profile.entreprises[0]
    : profile.entreprises;

  const analyse = ao.analyse_json as any;

  // Nouveau : récupération du profil entreprise détaillé
  const { data: entrepriseProfil } = await supabase
    .from("entreprise_profils")
    .select("*")
    .eq("entreprise_id", profile.entreprise_id)
    .single();

  const prompt = `Tu es un expert en rédaction de réponses aux appels d'offres publics marocains.

Marché : ${ao.intitule}
Acheteur : ${ao.acheteur_public}
Résumé : ${ao.analyse_resume ?? ""}
Exigences clés : ${(analyse?.exigences_cles ?? []).join("; ")}

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

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "Tu réponds uniquement en JSON valide, sans markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const trame = JSON.parse(completion.choices[0].message.content!);

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

  if (error) throw new Error(error.message);

  redirect(`/reponses/${reponse.id}`);
}