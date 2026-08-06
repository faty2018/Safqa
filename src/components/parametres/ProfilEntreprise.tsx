'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReferenceMarche = {
  id: string
  nom_marche: string
  client: string
  annee: string
  montant: string
  description: string
}

function nouvelleReference(): ReferenceMarche {
  return {
    id: crypto.randomUUID(),
    nom_marche: '',
    client: '',
    annee: '',
    montant: '',
    description: '',
  }
}

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

  const [references, setReferences] = useState<ReferenceMarche[]>(
    (profil.references_marches ?? []).length
      ? (profil.references_marches as any[]).map((r) => ({
          id: r.id ?? crypto.randomUUID(),
          nom_marche: r.nom_marche ?? '',
          client: r.client ?? '',
          annee: r.annee ? String(r.annee) : '',
          montant: r.montant ? String(r.montant) : '',
          description: r.description ?? '',
        }))
      : []
  )

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function ajouterReference() {
    setReferences((prev) => [...prev, nouvelleReference()])
  }

  function retirerReference(id: string) {
    setReferences((prev) => prev.filter((r) => r.id !== id))
  }

  function modifierReference(id: string, champ: keyof ReferenceMarche, valeur: string) {
    setReferences((prev) => prev.map((r) => (r.id === id ? { ...r, [champ]: valeur } : r)))
  }

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
      references_marches: references
        .filter((r) => r.nom_marche.trim() || r.client.trim())
        .map((r) => ({
          id: r.id,
          nom_marche: r.nom_marche.trim(),
          client: r.client.trim(),
          annee: r.annee ? Number(r.annee) : null,
          montant: r.montant ? Number(r.montant) : null,
          description: r.description.trim(),
        })),
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

      {/* Références marchés */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 pt-4">
          <label className="block text-sm font-medium text-slate-700">Références marchés</label>
          {!disabled && (
            <button
              type="button"
              onClick={ajouterReference}
              className="text-sm text-[#0F2A4A] font-medium hover:underline"
            >
              + Ajouter une référence
            </button>
          )}
        </div>

        {references.length === 0 && (
          <p className="text-sm text-slate-400">Aucune référence renseignée.</p>
        )}

        <div className="space-y-4">
          {references.map((ref, idx) => (
            <div key={ref.id} className="border border-slate-200 rounded-lg p-4 space-y-3 relative">
              {!disabled && (
                <button
                  type="button"
                  onClick={() => retirerReference(ref.id)}
                  className="absolute top-3 right-3 text-xs text-red-600 hover:underline"
                >
                  Retirer
                </button>
              )}
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Référence {idx + 1}
              </p>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Nom du marché</label>
                <input
                  value={ref.nom_marche}
                  disabled={disabled}
                  onChange={(e) => modifierReference(ref.id, 'nom_marche', e.target.value)}
                  placeholder="Ex. Fourniture de véhicules utilitaires"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Client</label>
                  <input
                    value={ref.client}
                    disabled={disabled}
                    onChange={(e) => modifierReference(ref.id, 'client', e.target.value)}
                    placeholder="Ex. Commune de Rabat"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Année</label>
                  <input
                    type="number"
                    value={ref.annee}
                    disabled={disabled}
                    onChange={(e) => modifierReference(ref.id, 'annee', e.target.value)}
                    placeholder="2022"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Montant (MAD)</label>
                  <input
                    type="number"
                    value={ref.montant}
                    disabled={disabled}
                    onChange={(e) => modifierReference(ref.id, 'montant', e.target.value)}
                    placeholder="3000000"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <textarea
                  value={ref.description}
                  disabled={disabled}
                  onChange={(e) => modifierReference(ref.id, 'description', e.target.value)}
                  rows={2}
                  placeholder="Détail de la prestation réalisée..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>
            </div>
          ))}
        </div>
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