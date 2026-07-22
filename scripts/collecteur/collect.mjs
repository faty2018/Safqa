import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEARCH_URL =
  "https://www.marchespublics.gov.ma/index.php?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons";

function formatDateFr(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Créer une nouvelle collecte pour ce run
  const aujourdHui = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: collecteExistante } = await supabase
    .from("collectes")
    .select("id")
    .eq("date_collecte", aujourdHui)
    .maybeSingle();

  let collecteId;
  if (collecteExistante) {
    collecteId = collecteExistante.id;
    console.log(`Collecte existante réutilisée : ${collecteId}`);
  } else {
    const { data: collecte, error: collecteError } = await supabase
      .from("collectes")
      .insert({ date_collecte: aujourdHui })
      .select("id")
      .single();

    if (collecteError || !collecte) {
      console.error("Erreur création collecte:", collecteError?.message);
      process.exit(1);
    }

    collecteId = collecte.id;
    console.log(`Nouvelle collecte créée : ${collecteId}`);
  }
  console.log(`Collecte créée : ${collecteId}`);

  console.log("Chargement du formulaire...");
  await page.goto(SEARCH_URL, { waitUntil: "networkidle" });

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);

  const dateDebutSelector = "#ctl0_CONTENU_PAGE_AdvancedSearch_dateMiseEnLigneCalculeStart";
  const dateFinSelector = "#ctl0_CONTENU_PAGE_AdvancedSearch_dateMiseEnLigneCalculeEnd";
  const boutonRechercheSelector = "#ctl0_CONTENU_PAGE_AdvancedSearch_lancerRecherche";

  await page.fill(dateDebutSelector, formatDateFr(weekAgo));
  await page.fill(dateFinSelector, formatDateFr(today));

  console.log("Soumission de la recherche...");
  await page.click(boutonRechercheSelector);
  await page.waitForLoadState("networkidle");

  let allResults = [];
  let hasNextPage = true;
  let pageNum = 1;

  while (hasNextPage) {
    console.log(`Extraction page ${pageNum}...`);

    const results = await page.$$eval('td[headers="cons_intitule"]', (cells) =>
      cells.map((cell) => {
        const row = cell.closest("tr");

        const refEl = row.querySelector('span[id*="_reference"]');
        const reference = refEl?.innerText?.trim() ?? null;

        const objetDiv = row.querySelector('div[id*="panelBlocObjet"]');
        let objet = objetDiv?.innerText?.trim() ?? "";
        objet = objet.replace(/^Objet\s*:\s*/i, "").replace(/\.\.\.$/, "").trim();

        const acheteurDiv = row.querySelector('div[id*="panelBlocDenomination"]');
        let acheteur = acheteurDiv?.innerText?.trim() ?? "";
        acheteur = acheteur.replace(/^Acheteur public\s*:\s*/i, "").trim();

        const dateDiv = row.querySelector('td[headers="cons_dateEnd"] div.cloture-line');
        const dateLimiteRaw = dateDiv?.innerText?.trim() ?? null;

        const lienEl = row.querySelector('a[href*="EntrepriseDetailConsultation"]');
        const lien = lienEl ? lienEl.getAttribute("href") : null;

        const categorieDiv = row.querySelector('div[id*="panelBlocCategorie"]');
        const categorie = categorieDiv?.innerText?.trim() ?? null;

        return { reference, objet, acheteur, dateLimiteRaw, lien, categorie };
      })
    );

    allResults = allResults.concat(results);

    const nextButton = await page.$("#ctl0_CONTENU_PAGE_resultSearch_PagerTop_ctl2");
    if (nextButton) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");
      pageNum++;
    } else {
      hasNextPage = false;
    }
  }

  await browser.close();

  console.log(`${allResults.length} AO extraits. Insertion en base...`);

  const domaineParCategorie = {};
  async function getDomaineId(nomCategorie) {
    if (!nomCategorie) return null;
    if (domaineParCategorie[nomCategorie]) return domaineParCategorie[nomCategorie];

    const { data, error } = await supabase
      .from("domaines")
      .select("id")
      .eq("nom", nomCategorie)
      .is("parent_id", null)
      .single();

    if (error || !data) return null;
    domaineParCategorie[nomCategorie] = data.id;
    return data.id;
  }

  for (const r of allResults) {
    if (!r.reference || !r.objet) continue;

    const { data: aoInsere, error } = await supabase
      .from("ao")
      .upsert(
        {
          reference: r.reference,
          intitule: r.objet,
          objet: r.objet,
          acheteur_public: r.acheteur || "Non renseigné",
          date_limite_remise_plis: parseDateFr(r.dateLimiteRaw),
          lien_source: r.lien ? new URL(r.lien, SEARCH_URL).toString() : null,
        },
        { onConflict: "reference" }
      )
      .select("id")
      .single();

    if (error || !aoInsere) {
      console.error(`Erreur insertion ${r.reference}:`, error?.message);
      continue;
    }

    const { data: dejaLie } = await supabase
      .from("ao_collectes")
      .select("collecte_id")
      .eq("ao_id", aoInsere.id)
      .maybeSingle();

    if (!dejaLie) {
      const { error: collecteError } = await supabase
        .from("ao_collectes")
        .insert({ ao_id: aoInsere.id, collecte_id: collecteId });
      if (collecteError) console.error(`Erreur lien collecte ${r.reference}:`, collecteError.message);
    }

    const domaineId = await getDomaineId(r.categorie);
    if (domaineId) {
      const { error: linkError } = await supabase
        .from("ao_domaines")
        .upsert(
          { ao_id: aoInsere.id, domaine_id: domaineId },
          { onConflict: "ao_id,domaine_id" }
        );
      if (linkError) console.error(`Erreur lien domaine ${r.reference}:`, linkError.message);
    }
  }

  console.log("Terminé.");
}

function parseDateFr(str) {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return new Date(`${y}-${m}-${d}`).toISOString();
}

main().catch(console.error);