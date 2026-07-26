import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEMP_DIR = "./temp-downloads";
const CONCURRENCY = 5;
const STEP_TIMEOUT = 15000;
const BATCH_SIZE = 150;
const EXTENSIONS_UTILES = [".pdf", ".docx", ".doc", ".xlsx", ".xls"];
const CONTACT = {
  nom: "Safqa",
  prenom: "Veille",
  email: "veille@safqa.ma",
  raisonSocial: "Safqa SARL",
};

function delaiAleatoire(minMs, maxMs) {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function traiterAO(page, ao) {
  await page.goto(ao.lien_source, { waitUntil: "domcontentloaded", timeout: STEP_TIMEOUT });

  const lienDossier = await page.$("#ctl0_CONTENU_PAGE_linkDownloadDce");
  if (!lienDossier) {
    console.log(`  → Pas de dossier disponible pour ${ao.reference}`);
    // On marque quand même comme "traité" pour ne pas re-tenter indéfiniment
    // un AO qui n'a simplement pas de dossier à télécharger.
    await supabase.from("ao").update({ dossier_zip_path: "AUCUN" }).eq("id", ao.id);
    return;
  }
  await lienDossier.click();
  await page.waitForLoadState("domcontentloaded", { timeout: STEP_TIMEOUT });

  const nomField = await page.$("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_nom");
  if (!nomField) {
    console.log(`  → Formulaire introuvable pour ${ao.reference}`);
    return;
  }

  await page.fill("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_nom", CONTACT.nom);
  await page.fill("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_prenom", CONTACT.prenom);
  await page.fill("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_email", CONTACT.email);
  await page.fill("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_raisonSocial", CONTACT.raisonSocial);
  await page.check("#ctl0_CONTENU_PAGE_EntrepriseFormulaireDemande_accepterConditions");

  await page.click("#ctl0_CONTENU_PAGE_validateButton");
  await page.waitForLoadState("domcontentloaded", { timeout: STEP_TIMEOUT });

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: STEP_TIMEOUT }),
    page.click("#ctl0_CONTENU_PAGE_EntrepriseDownloadDce_completeDownload"),
  ]);

  const zipPath = path.join(TEMP_DIR, `${ao.id}.zip`);
  await download.saveAs(zipPath);

  const zipBuffer = fs.readFileSync(zipPath);
  const zipStoragePath = `zips/${ao.id}.zip`;
  await supabase.storage.from("dossiers-consultation").upload(zipStoragePath, zipBuffer, {
    contentType: "application/zip",
    upsert: true,
  });

  // On extrait TOUS les documents utiles du ZIP, pas juste le premier PDF trouvé.
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter((e) => {
    if (e.isDirectory) return false;
    const nom = e.entryName.toLowerCase();
    return EXTENSIONS_UTILES.some((ext) => nom.endsWith(ext));
  });


  function nomFichierSain(nom) {
    return nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // enlève les accents (é -> e, etc.)
      .replace(/[^a-zA-Z0-9._-]/g, "_"); // remplace tout caractère spécial restant par _
  }
  const documentsPaths = [];
  for (const entry of entries) {
    const buffer = entry.getData();
    const nomFichier = nomFichierSain(entry.entryName.split("/").pop());
    const storagePath = `documents/${ao.id}/${nomFichier}`;
    await supabase.storage.from("dossiers-consultation").upload(storagePath, buffer, {
      upsert: true,
    });
    documentsPaths.push({
      nom: nomFichier,
      path: storagePath,
      extension: nomFichier.split(".").pop().toLowerCase(),
    });
  }

  const aPdf = documentsPaths.some((d) => d.extension === "pdf");
  // Garde dossier_pdf_path en compat avec l'existant : premier PDF si dispo, sinon null.
  const premierPdf = documentsPaths.find((d) => d.extension === "pdf");

  await supabase
    .from("ao")
    .update({
      dossier_zip_path: zipStoragePath,
      dossier_pdf_path: premierPdf ? premierPdf.path : null,
      dossier_documents: documentsPaths,
      dossier_a_pdf: aPdf,
    })
    .eq("id", ao.id);

  fs.unlinkSync(zipPath);
  console.log(`  → OK (${ao.reference}, ${documentsPaths.length} document(s), PDF: ${aPdf ? "oui" : "non"})`);
}

async function worker(browser, queue) {
  const context = await browser.newContext({ acceptDownloads: true });

  await context.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const page = await context.newPage();

  while (queue.length > 0) {
    const ao = queue.shift();
    if (!ao) break;

    try {
      await traiterAO(page, ao);
    } catch (err) {
      console.error(`  → Erreur ${ao.reference}: ${err.message}`);
      if (err.cause) console.error(`     Cause: ${err.cause}`);
      await supabase.from("ao").update({ statut_analyse: "echec" }).eq("id", ao.id);
    }
    await delaiAleatoire(800, 1500);
  }

  await context.close();
}

async function main() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

  // Filtre corrigé : dossier_zip_path (toujours rempli une fois traité, PDF ou pas)
  // plutôt que dossier_pdf_path (qui reste null pour les AOs sans PDF -> boucle infinie sinon).
  const { data: aoList } = await supabase
    .from("ao")
    .select("id, reference, lien_source")
    .not("lien_source", "is", null)
    .is("dossier_zip_path", null)
    .gte("date_limite_remise_plis", new Date().toISOString())
    .limit(BATCH_SIZE);

  console.log(`${aoList.length} AO à traiter, avec ${CONCURRENCY} en parallèle.`);

  const browser = await chromium.launch({ headless: true });
  const queue = [...aoList];
  const debut = Date.now();

  const workers = Array.from({ length: CONCURRENCY }, () => worker(browser, queue));
  await Promise.all(workers);

  await browser.close();
  const dureeMin = ((Date.now() - debut) / 60000).toFixed(1);
  console.log(`Terminé en ${dureeMin} min.`);
}

main().catch(console.error);