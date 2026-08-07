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
    // Champs bruts, toujours présents dès la collecte
    const morceaux = [ao.intitule, ao.objet, ao.acheteur_public];

    // Champs issus de l'analyse IA (Module 3) — pas encore remplis
    // pour un AO fraîchement collecté et pas encore analysé, donc on
    // les ajoute seulement s'ils existent (sinon "undefined"/"null"
    // finirait dans le texte, sans casser mais inutilement).
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

    // Mots-clés
    if (critere.mots_cles && critere.mots_cles.length > 0) {
        auMoinsUnFiltre = true;
        const texteAo = construireTexteRecherche(ao);
        const match = critere.mots_cles.some((mot) => texteAo.includes(normaliser(mot)));
        if (!match) return false;
    }

    return auMoinsUnFiltre;
}

async function main() {
    console.log('--- Démarrage du script alertes ---');

        // 1. Dernière collecte
        const { data: derniereCollecte, error: errCollecte } = await supabase
            .from('collectes')
            .select('id, date_collecte')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (errCollecte || !derniereCollecte) {
            console.error('Impossible de récupérer la dernière collecte:', errCollecte);
            return;
        }
        console.log(`Collecte du ${derniereCollecte.date_collecte} (id: ${derniereCollecte.id})`);

        // 2. AO liés à cette collecte
        const { data: aoCollectes, error: errAoCollectes } = await supabase
            .from('ao_collectes')
            .select('ao_id')
            .eq('collecte_id', derniereCollecte.id);

        if (errAoCollectes || !aoCollectes || aoCollectes.length === 0) {
            console.log('Aucun AO pour cette collecte, fin du script.');
            return;
        }
        const aoIds = aoCollectes.map((r) => r.ao_id);
        console.log(`${aoIds.length} AO à vérifier.`);

        // 3. Détails des AO
        const { data: aos, error: errAos } = await supabase
            .from('ao')
            .select('id, reference, intitule, objet, acheteur_public, montant_estime, analyse_resume, analyse_json')
            .in('id', aoIds);

        if (errAos || !aos) {
            console.error('Erreur récupération AO:', errAos);
            return;
        }

        // 4. Domaines par AO
        const { data: aoDomaines } = await supabase
            .from('ao_domaines')
            .select('ao_id, domaine_id')
            .in('ao_id', aoIds);

        const domaineIdsParAo = new Map();
        (aoDomaines || []).forEach((row) => {
            if (!domaineIdsParAo.has(row.ao_id)) domaineIdsParAo.set(row.ao_id, []);
            domaineIdsParAo.get(row.ao_id).push(row.domaine_id);
        });

        // 5. Critères actifs
        const { data: criteres, error: errCriteres } = await supabase
            .from('alertes_criteres')
            .select('*')
            .eq('actif', true);

        if (errCriteres || !criteres || criteres.length === 0) {
            console.log('Aucun critère actif, fin du script.');
            return;
        }
        console.log(`${criteres.length} critères actifs.`);

        // 6. Matching
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
                        lu: false,
                        email_envoye: false,
                    });
                }
            }
        }

        if (notificationsAInserer.length === 0) {
            console.log('Aucune correspondance trouvée.');
            return;
        }
        console.log(`${notificationsAInserer.length} notifications à créer.`);

        // 7. Insertion des notifications
        const { data: notifsInserees, error: errInsert } = await supabase
            .from('notifications')
            .insert(notificationsAInserer)
            .select();

        if (errInsert) {
            console.error('Erreur insertion notifications:', errInsert);
            return;
        }

        // 8. Envoi des emails groupés par utilisateur
        if (!resend) {
            console.log('RESEND_API_KEY absent — notifications in-app créées, pas d\'email envoyé.');
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

            const cartesHtml = notifs
                .map(
                    (n) => `
    <tr>
      <td style="padding: 16px 20px; border-bottom: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0F2A4A; line-height: 1.4;">
          ${n.titre.replace('Nouvel AO : ', '')}
        </p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #64748B; line-height: 1.4;">
          ${(n.message || '').split('. ')[1] || ''}
        </p>
      </td>
    </tr>`
                )
                .join('');

            const html = `
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
                <p style="margin: 0 0 4px; font-size: 16px; color: #0F172A;">Bonjour ${utilisateur.nom || ''},</p>
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

        console.log('--- Script alertes terminé ---');
    }

    main().catch((err) => {
        console.error('Erreur fatale:', err);
        process.exit(1);
    });