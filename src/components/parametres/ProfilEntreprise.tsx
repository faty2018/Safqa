'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilEntreprise({ entreprise, isAdmin }: { entreprise: any; isAdmin: boolean }) {
  const supabase = createClient()
  const profil = entreprise?.entreprise_profils?.[0] ?? entreprise?.entreprise_profils ?? {}

  const [form, setForm] = useState({
    description: profil.description ?? '',
    secteurs_activite: (profil.secteurs_activite ?? []).join(', '),
    effectif: profil.effectif ?? '',
    annees_experience: profil.annees_experience ?? '',
    moyens_materiels: profil.moyens_materiels ?? '',
    certifications: (profil.certifications ?? []).join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setMessage(null)

    const payload = {
      entreprise_id: entreprise.id,
      description: form.description,
      secteurs_activite: form.secteurs_activite.split(',').map((s) => s.trim()).filter(Boolean),
      effectif: form.effectif ? Number(form.effectif) : null,
      annees_experience: form.annees_experience ? Number(form.annees_experience) : null,
      moyens_materiels: form.moyens_materiels,
      certifications: form.certifications.split(',').map((s) => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('entreprise_profils')
      .upsert(payload, { onConflict: 'entreprise_id' })

    setSaving(false)
    setMessage(error ? 'Erreur — vérifiez vos droits' : 'Enregistré ✓')
  }

  const disabled = !isAdmin

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      {disabled && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Seul un administrateur peut modifier le profil entreprise.
        </p>
      )}

      <div>
        <label className="block text-sm text-slate-600 mb-1">Raison sociale</label>
        <input
          value={entreprise?.raison_sociale ?? ''}
          disabled
          className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Description</label>
        <textarea
          value={form.description}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Effectif</label>
          <input
            type="number"
            value={form.effectif}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, effectif: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Années d'expérience</label>
          <input
            type="number"
            value={form.annees_experience}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, annees_experience: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Secteurs d'activité (séparés par virgule)</label>
        <input
          value={form.secteurs_activite}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, secteurs_activite: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Certifications (séparées par virgule)</label>
        <input
          value={form.certifications}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, certifications: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Moyens matériels</label>
        <textarea
          value={form.moyens_materiels}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, moyens_materiels: e.target.value })}
          rows={2}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>

      {!disabled && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-[#0F2A4A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>
      )}
    </div>
  )
}