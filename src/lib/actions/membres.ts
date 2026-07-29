'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

type InviterMembreParams = {
    email: string
    role: 'administrateur' | 'bid_manager' | 'analyste'
    entrepriseId: string
}

export async function inviterMembre({ email, role, entrepriseId }: InviterMembreParams) {
    // 1. Vérifier que l'appelant est admin de CETTE entreprise
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: appelant } = await supabase
        .from('utilisateurs')
        .select('role, entreprise_id')
        .eq('id', user.id)
        .single()

    if (
        !appelant ||
        appelant.role !== 'administrateur' ||
        appelant.entreprise_id !== entrepriseId
    ) {
        return { error: 'Non autorisé' }
    }

    // 2. Client service_role — jamais exposé au navigateur, ok dans une Server Action
    const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/accepter-invitation`,
    })

    if (inviteError) return { error: inviteError.message }

    const { data: nouveauMembre, error: insertError } = await admin
        .from('utilisateurs')
        .insert({
            id: invited.user.id,
            entreprise_id: entrepriseId,
            email,
            nom: '',
            role,
        })
        .select()
        .single()

    if (insertError) return { error: insertError.message }

    return { utilisateur: nouveauMembre }
}

type ChangerRoleParams = {
    utilisateurId: string
    nouveauRole: 'administrateur' | 'bid_manager' | 'analyste'
}

export async function changerRoleMembre({ utilisateurId, nouveauRole }: ChangerRoleParams) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('changer_role_membre', {
        p_utilisateur_id: utilisateurId,
        p_nouveau_role: nouveauRole,
    })
    return error ? { error: error.message } : { success: true }
}

export async function retirerMembre(utilisateurId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('utilisateurs').delete().eq('id', utilisateurId)
    return error ? { error: error.message } : { success: true }
}