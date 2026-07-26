import 'dotenv/config';

// Filet de sécurité: certains PDFs corrompus font planter pdf.js en interne
// avec une "unhandled rejection" qui échappe au try/catch classique.
// On l'intercepte ici pour ne pas crasher tout le script pour un seul fichier.
process.on('unhandledRejection', (reason) => {
  console.warn('⚠ Rejection non gérée interceptée (probablement un PDF corrompu), on continue:', reason?.message || reason);
});

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';
import * as XLSX from 'xlsx';

// --- Config ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BUCKET = 'dossiers-consultation';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // ou 'llama-3.1-8b-instant' si tu veux + de débit
const MAX_CHARS_PAR_DOC = 6000; // pour rester safe niveau TPM (12000 tokens/min sur llama-3.3-70b)

// --- Extraction par type de fichier ---
async function extraireTexte(buffer, extension) {
  const ext = extension.toLowerCase();

  try {
    if (ext === 'pdf') {
      const data = await Promise.race([
        pdfParse(buffer),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout extraction PDF (30s)')), 30000)
        )
      ]);
      return data.text;
    }

    if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    if (ext === 'doc') {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      return doc.getBody();
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let texteComplet = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        texteComplet += `\n--- Feuille: ${sheetName} ---\n${csv}\n`;
      }
      return texteComplet;
    }

    console.warn(`Type non supporté pour extraction: ${ext}`);
    return null;
  } catch (err) {
    console.error(`Erreur extraction (${ext}):`, err.message);
    return null;
  }
}

// --- Téléchargement d'un fichier depuis Supabase Storage (avec fallback anti-accents) ---
function enleverAccents(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/°/g, '')                                  // symbole degré
    .replace(/['']/g, "'")                              // apostrophes typographiques
    .replace(/[""]/g, '"');                             // guillemets typographiques
}

async function telechargerFichier(path) {
  // Tentative 1: path tel quel
  let { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (!error) return Buffer.from(await data.arrayBuffer());

  // Tentative 2: normalisation NFC (au cas où le DB stocke en NFD ou inversement)
  const pathNFC = path.normalize('NFC');
  if (pathNFC !== path) {
    ({ data, error } = await supabase.storage.from(BUCKET).download(pathNFC));
    if (!error) return Buffer.from(await data.arrayBuffer());
  }

  // Tentative 3: sans accents du tout (si le fichier réel a été sanitizé à l'upload)
  const pathSansAccents = enleverAccents(path);
  if (pathSansAccents !== path) {
    ({ data, error } = await supabase.storage.from(BUCKET).download(pathSansAccents));
    if (!error) {
      console.log(`  (récupéré via version sans accents: ${pathSansAccents})`);
      return Buffer.from(await data.arrayBuffer());
    }
  }

  throw new Error(`Download failed for ${path} (toutes tentatives échouées): ${error.message}`);
}

// --- Analyse via Groq ---
async function analyserAvecGroq(texteConcatene, aoInfo) {
  let tentative = 0;
  const maxTentatives = 5;
  let texteActuel = texteConcatene;

  while (tentative < maxTentatives) {
    const prompt = `Tu es un expert en analyse d'appels d'offres publics marocains (marchés publics).

Voici les informations de l'AO:
Référence: ${aoInfo.reference}
Intitulé: ${aoInfo.intitule}
Acheteur public: ${aoInfo.acheteur_public}

Voici le contenu extrait des documents du dossier de consultation:
${texteActuel}

Analyse ce dossier et réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour) avec cette structure exacte:
{
  "resume": "résumé en 2-3 phrases de l'objet du marché",
  "criteres_eligibilite": ["critère 1", "critère 2"],
  "documents_requis": ["document 1", "document 2"],
  "montant_estimatif": "montant si mentionné, sinon null",
  "delai_execution": "délai si mentionné, sinon null",
  "points_attention": ["point 1", "point 2"],
  "score_complexite": "faible|moyen|eleve"
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Tu réponds uniquement en JSON valide, sans markdown ni texte additionnel.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1024, // limite explicite pour éviter de consommer tout le budget TPM par défaut
        response_format: { type: 'json_object' }
      });

      const contenu = completion.choices[0].message.content;
      return JSON.parse(contenu);

    } catch (err) {
      tentative++;
      const isRateLimitTokens = err.status === 413 || (err.status === 429 && err.message?.includes('tokens'));
      const isRateLimitRequests = err.status === 429 && !isRateLimitTokens;

      if (isRateLimitTokens) {
        if (tentative >= maxTentatives) {
          throw new Error(`Échec après ${maxTentatives} tentatives de réduction: toujours trop de tokens (${err.message})`);
        }
        // Réduit le texte de moitié à chaque tentative au lieu de juste attendre
        texteActuel = texteActuel.slice(0, Math.floor(texteActuel.length / 2));
        console.warn(`Tentative ${tentative}/${maxTentatives}: texte trop long, réduit à ${texteActuel.length} caractères. Retry immédiat.`);
        continue;
      }

      const delai = isRateLimitRequests ? Math.pow(2, tentative) * 1000 : 2000;
      console.warn(`Tentative ${tentative}/${maxTentatives} échouée: ${err.message}. Retry dans ${delai}ms`);

      if (tentative >= maxTentatives) throw err;
      await new Promise(resolve => setTimeout(resolve, delai));
    }
  }
}

// --- Traitement d'un AO ---
async function traiterAO(ao) {
  console.log(`\n=== Traitement AO ${ao.reference} ===`);

  if (!ao.dossier_documents || ao.dossier_documents.length === 0) {
    await supabase.from('ao').update({ statut_analyse: 'non_analysable' }).eq('id', ao.id);
    console.log('Pas de documents, marqué non_analysable');
    return;
  }

  let texteConcatene = '';

  for (const doc of ao.dossier_documents) {
    // Adapte selon la structure exacte de ton JSONB dossier_documents
    // Ex attendu: { path: "...", extension: "pdf", nom: "..." }
    try {
      const buffer = await telechargerFichier(doc.path);
      const texte = await extraireTexte(buffer, doc.extension);

      if (texte) {
        const texteTronque = texte.slice(0, MAX_CHARS_PAR_DOC);
        texteConcatene += `\n\n=== Document: ${doc.nom || doc.path} ===\n${texteTronque}`;
      }
    } catch (err) {
      console.error(`Erreur sur document ${doc.path}:`, err.message);
    }
  }

  if (!texteConcatene.trim()) {
    await supabase.from('ao').update({ statut_analyse: 'non_analysable' }).eq('id', ao.id);
    console.log('Aucun texte extrait, marqué non_analysable');
    return;
  }

  // Sécurité globale sur la taille totale envoyée à Groq (TPM)
  const texteFinal = texteConcatene.slice(0, 30000); // ~7500 tokens, marge de sécurité sous 12000 TPM

  try {
    const analyse = await analyserAvecGroq(texteFinal, ao);

    await supabase
      .from('ao')
      .update({
        statut_analyse: 'terminee',
        analyse_json: analyse,
        analyse_resume: analyse.resume || null
      })
      .eq('id', ao.id);

    console.log(`✓ Analyse terminée pour ${ao.reference}`);
  } catch (err) {
    console.error(`✗ Échec analyse pour ${ao.reference}:`, err.message);
    await supabase.from('ao').update({ statut_analyse: 'echec' }).eq('id', ao.id);
  }
}

// --- Boucle principale ---
async function main() {
  const { data: aosAAnalyser, error } = await supabase
    .from('ao')
    .select('*')
    .eq('statut_analyse', 'non_analyse')
    .not('dossier_zip_path', 'is', null) // ton indicateur "déjà traité/téléchargé"
    .not('dossier_documents', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50); // ~50 AOs/jour, cohérent avec le quota gratuit Groq (100k tokens/jour)

  if (error) {
    console.error('Erreur récupération AOs:', error.message);
    process.exit(1);
  }

  console.log(`${aosAAnalyser.length} AOs à analyser`);

  for (const ao of aosAAnalyser) {
    await traiterAO(ao);
    // Petite pause pour rester sous le RPM (30 req/min sur le tier gratuit)
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  console.log('\nTerminé.');
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
