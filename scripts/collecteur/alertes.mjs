import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function normaliser(texte) {
  return (texte || '').toLowerCase();
}

function construireTexteRecherche(ao) {
  const morceaux = [ao.intitule, ao.objet, ao.acheteur_public];

  if (ao.analyse_resume) {
    morceaux.push(ao.analyse_resume);
  }
  if (ao.analyse_json) {
    const exigences = ao.analyse_json.exigences_cles;
    if (Array.isArray(exigences)) {
      morceaux.push(exigences.join(' '));
    }
  }

  return normaliser(morceaux.filter(Boolean).join(' '));
}

function critereMatch(ao, critere, domaineIdsParAo) {
  let auMoinsUnFiltre = false;

  if (critere.mots_cles && critere.mots_cles.length > 0) {
    auMoinsUnFiltre = true;
    const texteAo = construireTexteRecherche(ao);
    const match = critere.mots_cles.some((mot) => texteAo.includes(normaliser(mot)));
    if (!match) return false;
  }

  if (critere.domaine_ids && critere.domaine_ids.length > 0) {
    auMoinsUnFiltre = true;
    const domainesAo = domaineIdsParAo.get(ao.id) || [];
    const match = critere.domaine_ids.some((id) => domainesAo.includes(id));
    if (!match) return false;
  }

  if (critere.montant_min != null) {
    auMoinsUnFiltre = true;
    if (ao.montant_estime == null || ao.montant_estime < critere.montant_min) return false;
  }

  if (critere.montant_max != null) {
    auMoinsUnFiltre = true;
    if (ao.montant_estime == null || ao.montant_estime > critere.montant_max) return false;
  }

  return auMoinsUnFiltre;
}

function formaterDateCourte(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function construireEmailHtml(nomUtilisateur, notifs) {
  const MAX_AFFICHES = 5;
  const notifsAffichees = notifs.slice(0, MAX_AFFICHES);
  const nombreRestant = notifs.length - notifsAffichees.length;

  const cartesHtml = notifsAffichees
    .map((n) => {
      const dateLimite = formaterDateCourte(n.date_limite_offre);
      return `
    <tr>
      <td style="padding: 16px 20px; border-bottom: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0F2A4A; line-height: 1.4;">
          ${n.titre.replace('Nouvel AO : ', '')}
        </p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #64748B; line-height: 1.4;">
          ${(n.message || '').split('. ')[1] || ''}
        </p>
        ${dateLimite
          ? `<p style="margin: 6px 0 0; font-size: 12px; color: #B45309; font-weight: 600;">Date limite : ${dateLimite}</p>`
          : ''
        }
      </td>
    </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; max-width: 600px;">

            <tr>
              <td style="background-color: #0F2A4A; padding: 24px 32px;">
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">Safqa</p>
                <p style="margin: 2px 0 0; font-size: 12px; color: #94A3B8;">Public Procurement</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 28px 32px 12px;">
                <p style="margin: 0 0 4px; font-size: 16px; color: #0F172A;">Bonjour ${nomUtilisateur || ''},</p>
                <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.5;">
                  <strong style="color: #0F2A4A;">${notifs.length}</strong> nouvel(le)(s) appel(s) d'offres correspond(ent) à vos critères de veille.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 8px 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
                  ${cartesHtml}
                </table>
                ${nombreRestant > 0
      ? `<p style="margin: 12px 0 0; font-size: 13px; color: #64748B; text-align: center;">+ ${nombreRestant} autre(s) AO correspondant(s)</p>`
      : ''
    }
              </td>
            </tr>

            <tr>
              <td style="padding: 0 32px 32px;">
                <a href="https://TON-DOMAINE.com/alertes" style="display: inline-block; background-color: #0F2A4A; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px;">
                  Voir toutes mes alertes
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;">
                <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                  Vous recevez cet email car vous avez configuré une alerte sur Safqa.
                  Gérez vos préférences dans les paramètres de votre compte.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function main() {
  console.log('--- Démarrage du script alertes ---');

  // 1. Dernière exécution du script (et pas la dernière collecte : on veut
  // tous les AO ajoutés depuis le dernier passage, potentiellement issus
  // de plusieurs collectes si le cron tourne toutes les heures).
  const { data: etat, error: errEtat } = await supabase
    .from('alertes_etat')
    .select('derniere_execution')
    .eq('id', 1)
    .single();

  if (errEtat || !etat) {
    console.error("Impossible de récupérer l'état alertes_etat:", errEtat);
    return;
  }

  const derniereExecution = etat.derniere_execution;
  const debutDeCeRun = new Date().toISOString();
  console.log(`Recherche des AO créés depuis ${derniereExecution}`);

  // 2. AO créés depuis la dernière exécution
  const { data: aos, error: errAos } = await supabase
    .from('ao')
    .select('id, reference, intitule, objet, acheteur_public, montant_estime, created_at, analyse_resume, analyse_json')
    .gt('created_at', derniereExecution);

  if (errAos) {
    console.error('Erreur récupération AO:', errAos);
    return;
  }

  if (!aos || aos.length === 0) {
    console.log('Aucun nouvel AO depuis la dernière exécution.');
    await supabase.from('alertes_etat').update({ derniere_execution: debutDeCeRun }).eq('id', 1);
    return;
  }
  console.log(`${aos.length} nouvel(aux) AO à vérifier.`);

  const aoIds = aos.map((a) => a.id);

  // 3. Domaines par AO
  const { data: aoDomaines } = await supabase
    .from('ao_domaines')
    .select('ao_id, domaine_id')
    .in('ao_id', aoIds);

  const domaineIdsParAo = new Map();
  (aoDomaines || []).forEach((row) => {
    if (!domaineIdsParAo.has(row.ao_id)) domaineIdsParAo.set(row.ao_id, []);
    domaineIdsParAo.get(row.ao_id).push(row.domaine_id);
  });

  // 4. Critères actifs
  const { data: criteres, error: errCriteres } = await supabase
    .from('alertes_criteres')
    .select('*')
    .eq('actif', true);

  if (errCriteres) {
    console.error('Erreur récupération critères:', errCriteres);
    return;
  }

  if (!criteres || criteres.length === 0) {
    console.log('Aucun critère actif.');
    await supabase.from('alertes_etat').update({ derniere_execution: debutDeCeRun }).eq('id', 1);
    return;
  }
  console.log(`${criteres.length} critères actifs.`);

  // 5. Matching
  const notificationsAInserer = [];
  for (const ao of aos) {
    for (const critere of criteres) {
      if (critereMatch(ao, critere, domaineIdsParAo)) {
        notificationsAInserer.push({
          utilisateur_id: critere.utilisateur_id,
          ao_id: ao.id,
          type: 'nouvelle_correspondance',
          alerte_critere_id: critere.id,
          titre: `Nouvel AO : ${ao.intitule || ao.reference}`,
          message: `Correspond à votre critère "${critere.nom}". ${ao.acheteur_public || ''}`,
          date_limite_offre: ao.created_at,
          lu: false,
          email_envoye: false,
        });
      }
    }
  }

  if (notificationsAInserer.length === 0) {
    console.log('Aucune correspondance trouvée.');
    await supabase.from('alertes_etat').update({ derniere_execution: debutDeCeRun }).eq('id', 1);
    return;
  }
  console.log(`${notificationsAInserer.length} notifications à créer.`);

  // 6. Insertion des notifications
  const { data: notifsInserees, error: errInsert } = await supabase
    .from('notifications')
    .insert(notificationsAInserer)
    .select();

  if (errInsert) {
    console.error('Erreur insertion notifications:', errInsert);
    return;
  }

  // 7. Envoi des emails groupés par utilisateur
  if (!resend) {
    console.log("RESEND_API_KEY absent — notifications in-app créées, pas d'email envoyé.");
    await supabase.from('alertes_etat').update({ derniere_execution: debutDeCeRun }).eq('id', 1);
    return;
  }

  const notifsParUtilisateur = new Map();
  notifsInserees.forEach((n) => {
    if (!notifsParUtilisateur.has(n.utilisateur_id)) notifsParUtilisateur.set(n.utilisateur_id, []);
    notifsParUtilisateur.get(n.utilisateur_id).push(n);
  });

  for (const [utilisateurId, notifs] of notifsParUtilisateur) {
    const { data: utilisateur } = await supabase
      .from('utilisateurs')
      .select('email, nom')
      .eq('id', utilisateurId)
      .single();

    if (!utilisateur?.email) continue;

    const html = construireEmailHtml(utilisateur.nom, notifs);

    try {
      await resend.emails.send({
        from: 'Safqa <onboarding@resend.dev>',
        to: utilisateur.email,
        subject: `${notifs.length} nouvel(le)(s) AO correspondant à vos critères`,
        html,
      });

      const idsNotifs = notifs.map((n) => n.id);
      await supabase.from('notifications').update({ email_envoye: true }).in('id', idsNotifs);
      console.log(`Email envoyé à ${utilisateur.email} (${notifs.length} notifs).`);
    } catch (err) {
      console.error(`Erreur envoi email à ${utilisateur.email}:`, err);
    }
  }

  // 8. On avance le curseur seulement une fois tout traité avec succès
  await supabase.from('alertes_etat').update({ derniere_execution: debutDeCeRun }).eq('id', 1);

  console.log('--- Script alertes terminé ---');
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
