import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash-lite";
const BATCH_SIZE = 30;
const DELAI_ENTRE_APPELS_MS = 4500;
const TENTATIVES_MAX = 3;

const PROMPT = `Tu es un assistant d'analyse d'appels d'offres publics marocains.
Analyse les documents fournis (Cahier des Prescriptions Spéciales, Règlement de Consultation, etc.)
et réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format suivant :

{
  "resume": "résumé en 3-4 phrases de l'objet du marché",
  "montant_estime": "montant en MAD si mentionné explicitement, sinon null",
  "delai_execution": "délai d'exécution si mentionné, sinon null",
  "lots": ["description de chaque lot si le marché est alloti, sinon tableau vide"],
  "exigences_cles": ["liste des exigences principales : qualifications, agréments, garanties, documents requis"],
  "dates_importantes": ["dates clés autres que la date limite de remise des plis, si mentionnées"],
  "criteres_evaluation": "résumé des critères de sélection/évaluation des offres si mentionnés, sinon null"
}`;

function delai(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function avecRetry(fn, tentatives = TENTATIVES_MAX) {
  for (let i = 1; i <= tentatives; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === tentatives) throw err;
      console.log(`     retry ${i}/${tentatives - 1} après: ${err.message}`);
      await delai(3000 * i); // backoff progressif
    }
  }
}

async function telechargerVersFichierTemp(storagePath) {
  const { data, error } = await supabase.storage
    .from("dossiers-consultation")
    .download(storagePath);
  if (error) throw new Error(`Téléchargement échoué (${storagePath}): ${error.message}`);

  const buffer = Buffer.from(await data.arrayBuffer());
  const tempPath = path.join(os.tmpdir(), `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function uploaderVersGemini(tempPath) {
  let file = await avecRetry(() => ai.files.upload({ file: tempPath, config: { mimeType: "application/pdf" } }));

  // Attend que Gemini finisse de traiter le fichier avant de pouvoir l'utiliser
  while (file.state === "PROCESSING") {
    await delai(2000);
    file = await ai.files.get({ name: file.name });
  }
  if (file.state === "FAILED") {
    throw new Error(`Traitement Gemini échoué pour ${file.name}`);
  }
  return file;
}

async function analyserAO(ao) {
  const pdfs = (ao.dossier_documents || []).filter((d) => d.extension === "pdf");

  if (pdfs.length === 0) {
    console.log(`  → ${ao.reference} : pas de PDF, marqué non_analysable.`);
    await supabase.from("ao").update({ statut_analyse: "non_analysable" }).eq("id", ao.id);
    return;
  }

  const tempFiles = [];
  const fileParts = [];

  try {
    for (const pdf of pdfs) {
      const tempPath = await avecRetry(() => telechargerVersFichierTemp(pdf.path));
      tempFiles.push(tempPath);

      const fichierGemini = await uploaderVersGemini(tempPath);
      fileParts.push({
        fileData: { fileUri: fichierGemini.uri, mimeType: fichierGemini.mimeType },
      });
    }

    const response = await avecRetry(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: PROMPT }, ...fileParts] }],
      })
    );

    const texte = response.text.trim();
    const jsonNettoye = texte.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");

    let analyse;
    try {
      analyse = JSON.parse(jsonNettoye);
    } catch {
      throw new Error(`Réponse Gemini non-JSON pour ${ao.reference}: ${texte.slice(0, 200)}`);
    }

    await supabase
      .from("ao")
      .update({
        statut_analyse: "terminee",
        analyse_resume: analyse.resume || null,
        analyse_json: analyse,
      })
      .eq("id", ao.id);

    console.log(`  → OK ${ao.reference}`);
  } finally {
    for (const f of tempFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

async function main() {
  const { data: aoList, error } = await supabase
    .from("ao")
    .select("id, reference, dossier_documents")
    .eq("dossier_a_pdf", true)
    .eq("statut_analyse", "non_analyse")
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Erreur récupération AO:", error.message);
    process.exit(1);
  }

  console.log(`${aoList.length} AO à analyser.`);

  for (const ao of aoList) {
    try {
      await analyserAO(ao);
    } catch (err) {
      console.error(`  → Erreur ${ao.reference}: ${err.message}`);
      await supabase.from("ao").update({ statut_analyse: "echec" }).eq("id", ao.id);
    }
    await delai(DELAI_ENTRE_APPELS_MS);
  }

  console.log("Terminé.");
}

main().catch(console.error);