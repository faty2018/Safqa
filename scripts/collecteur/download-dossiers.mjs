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
const CONCURRENCY = 5; // 2 -> 5 : gain direct proportionnel, teste et ajuste si le site rate-limit
const STEP_TIMEOUT = 15000; // 60s -> 15s : échoue vite plutôt que de bloquer un worker entier
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

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter((e) => e.entryName.toLowerCase().endsWith(".pdf"));

  let pdfStoragePath = null;
  if (entries.length > 0) {
    const pdfBuffer = entries[0].getData();
    pdfStoragePath = `pdfs/${ao.id}.pdf`;
    await supabase.storage.from("dossiers-consultation").upload(pdfStoragePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  }

  await supabase
    .from("ao")
    .update({ dossier_zip_path: zipStoragePath, dossier_pdf_path: pdfStoragePath })
    .eq("id", ao.id);

  fs.unlinkSync(zipPath);
  console.log(`  → OK (${ao.reference}, ${entries.length} PDF)`);
}

// Un "worker" traite une portion de la file, avec son propre contexte de navigateur
async function worker(browser, queue) {
  const context = await browser.newContext({ acceptDownloads: true });

  // Bloque les ressources inutiles (images, CSS, fonts) -> chaque navigation charge
  // beaucoup moins de données, donc beaucoup plus vite. On garde le JS car PRADO
  // en a besoin pour le postback.
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
      console.error(`  → Erreur ${ao.reference} : ${err.message}`);
    }
    await delaiAleatoire(800, 1500); // légèrement réduit, ajuste si le site bloque
  }

  await context.close();
}

async function main() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

  const { data: aoList } = await supabase
    .from("ao")
    .select("id, reference, lien_source")
    .not("lien_source", "is", null)
    .is("dossier_pdf_path", null)
    .gte("date_limite_remise_plis", new Date().toISOString());

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