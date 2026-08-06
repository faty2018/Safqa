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

function critereMatch(ao, critere, domaineIdsParAo) {
    let auMoinsUnFiltre = false;

    // Mots-clés
    if (critere.mots_cles && critere.mots_cles.length > 0) {
        auMoinsUnFiltre = true;
        const texteAo = normaliser(`${ao.intitule} ${ao.objet} ${ao.acheteur_public}`);
        const match = critere.mots_cles.some((mot) => texteAo.includes(normaliser(mot)));
        if (!match) return false;
    }

    // Secteurs (domaines)
    if (critere.domaine_ids && critere.domaine_ids.length > 0) {
        auMoinsUnFiltre = true;
        const domainesAo = domaineIdsParAo.get(ao.id) || [];
        const match = critere.domaine_ids.some((id) => domainesAo.includes(id));
        if (!match) return false;
    }

    // Montant min
    if (critere.montant_min != null) {
        auMoinsUnFiltre = true;
        if (ao.montant_estime == null || ao.montant_estime < critere.montant_min) return false;
    }

    // Montant max
    if (critere.montant_max != null) {
        auMoinsUnFiltre = true;
        if (ao.montant_estime == null || ao.montant_estime > critere.montant_max) return false;
    }

    // Un critère sans aucun filtre rempli ne doit jamais tout matcher
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
        .select('id, reference, intitule, objet, acheteur_public, montant_estime')
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

        const listeHtml = notifs.map((n) => `<li>${n.titre}</li>`).join('');

        try {
            await resend.emails.send({
                from: 'Safqa <onboarding@resend.dev>',
                to: utilisateur.email,
                subject: `${notifs.length} nouvel(le)(s) AO correspondant à vos critères`,
                html: `<p>Bonjour ${utilisateur.nom || ''},</p><p>Voici les AO qui correspondent à vos critères :</p><ul>${listeHtml}</ul>`,
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