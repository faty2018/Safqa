'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MonCompte({ currentUser }: { currentUser: any }) {
  const supabase = createClient()
  const [nom, setNom] = useState(currentUser.nom ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  async function saveNom() {
    setSaving(true)
    setMessage(null)
    // IMPORTANT: on n'envoie jamais "role" ici, uniquement "nom"
    const { error } = await supabase
      .from('utilisateurs')
      .update({ nom })
      .eq('id', currentUser.id)

    setSaving(false)
    setMessage(error ? "Erreur lors de l'enregistrement" : 'Enregistré ✓')
  }

  async function updatePassword() {
    if (newPassword.length < 8) {
      setPwMessage('8 caractères minimum')
      return
    }
    setPwSaving(true)
    setPwMessage(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    setPwMessage(error ? error.message : 'Mot de passe mis à jour ✓')
    if (!error) setNewPassword('')
  }

  const roleLabels: Record<string, string> = {
    administrateur: 'Administrateur',
    bid_manager: 'Bid Manager',
    analyste: 'Analyste',
  }

  return (
    <div className="space-y-8 max-w-lg">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900 mb-4">Informations</h2>

        <label className="block text-sm text-slate-600 mb-1">Nom complet</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20"
        />

        <label className="block text-sm text-slate-600 mb-1">Email</label>
        <input
          value={currentUser.email}
          disabled
          className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 mb-4"
        />

        <label className="block text-sm text-slate-600 mb-1">Rôle</label>
        <span className="inline-block bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {roleLabels[currentUser.role] ?? currentUser.role}
        </span>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={saveNom}
            disabled={saving}
            className="bg-[#0F2A4A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900 mb-4">Mot de passe</h2>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={updatePassword}
            disabled={pwSaving}
            className="bg-[#0F2A4A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {pwSaving ? '...' : 'Changer le mot de passe'}
          </button>
          {pwMessage && <span className="text-sm text-slate-500">{pwMessage}</span>}
        </div>
      </section>
    </div>
  )
}