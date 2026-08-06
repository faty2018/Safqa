import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'dossiers-consultation';

async function listerRecursif(path = '') {
  let fichiers = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id === null) {
        fichiers = fichiers.concat(await listerRecursif(fullPath));
      } else {
        fichiers.push(fullPath);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }
  return fichiers;
}

async function viderDossier(prefix) {
  console.log(`Listing des fichiers dans ${prefix}...`);
  const tousLesFichiers = await listerRecursif(prefix);
  console.log(`${tousLesFichiers.length} fichiers trouvés.`);
  if (tousLesFichiers.length === 0) return console.log('Rien à supprimer.');

  const BATCH = 100;
  let supprimes = 0;
  for (let i = 0; i < tousLesFichiers.length; i += BATCH) {
    const batch = tousLesFichiers.slice(i, i + BATCH);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) { console.error('Erreur:', error); continue; }
    supprimes += batch.length;
    console.log(`${supprimes}/${tousLesFichiers.length} supprimés...`);
  }
  console.log(`Terminé pour ${prefix} !`);
}

viderDossier('documents');