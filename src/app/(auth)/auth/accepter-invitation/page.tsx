'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccepterInvitation() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Supabase gère automatiquement le hash #access_token=... au chargement
    // et crée une session. On vérifie juste qu'elle existe.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        setError('Lien invalide ou expiré. Demandez une nouvelle invitation.')
      }
    })
  }, [])

  async function activerCompte() {
    setError(null)
    if (password.length < 8) {
      setError('8 caractères minimum')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    router.push('/dashboard')
  }

  if (!ready && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Vérification de l'invitation...</p>
      </div>
    )
  }

  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-xl p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Bienvenue sur Safqa</h1>
        <p className="text-sm text-slate-500 mb-6">Définissez votre mot de passe pour activer votre compte.</p>

        <label className="block text-sm text-slate-600 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
        />

        <label className="block text-sm text-slate-600 mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={activerCompte}
          disabled={saving}
          className="w-full bg-[#0F2A4A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Activation...' : 'Activer mon compte'}
        </button>
      </div>
    </div>
  )
}