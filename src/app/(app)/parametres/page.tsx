import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParametresTabs from '@/components/parametres/ParametresTabs'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: monProfil } = await supabase
    .from('utilisateurs')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!monProfil) redirect('/login')

  const isAdmin = monProfil.role === 'administrateur'

  const { data: entreprise } = await supabase
    .from('entreprises')
    .select('*, entreprise_profils(*)')
    .eq('id', monProfil.entreprise_id)
    .single()

  const { data: membres } = isAdmin
    ? await supabase
        .from('utilisateurs')
        .select('*')
        .eq('entreprise_id', monProfil.entreprise_id)
        .order('created_at', { ascending: true })
    : { data: null }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Paramètres</h1>
      <p className="text-slate-500 mt-1 mb-8">Gérez votre compte et votre entreprise.</p>

      <ParametresTabs
        currentUser={monProfil}
        entreprise={entreprise}
        membres={membres}
        isAdmin={isAdmin}
      />
    </div>
  )
}