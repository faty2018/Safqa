'use client'

import { useState, useTransition } from 'react'
import { creerCritere } from '@/lib/actions/alertes-criteres'

type Props = {
  domaines: { id: string; nom: string }[]
  onClose: () => void
  onCreated: () => void
}

export default function FormulaireCritere({ domaines, onClose, onCreated }: Props) {
  const [nom, setNom] = useState('')
  const [motsClesTexte, setMotsClesTexte] = useState('')
  const [domaineIds, setDomaineIds] = useState<string[]>([])
  const [montantMin, setMontantMin] = useState('')
  const [montantMax, setMontantMax] = useState('')
  const [canal, setCanal] = useState<'email' | 'inapp' | 'email_et_inapp'>('email_et_inapp')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleDomaine(id: string) {
    setDomaineIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  function handleSubmit() {
    setError(null)

    if (!nom.trim()) {
      setError('Le nom du critère est requis.')
      return
    }

    const motsCles = motsClesTexte
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)

    if (motsCles.length === 0 && domaineIds.length === 0 && !montantMin && !montantMax) {
      setError('Remplissez au moins un filtre (mots-clés, secteur, ou montant).')
      return
    }

    startTransition(async () => {
      const result = await creerCritere({
        nom: nom.trim(),
        motsCles,
        domaineIds,
        montantMin: montantMin ? Number(montantMin) : null,
        montantMax: montantMax ? Number(montantMax) : null,
        canal,
      })

      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la création.')
        return
      }
      onCreated()
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Nom du critère</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: Travaux Casablanca"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F2A4A]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Mots-clés (séparés par des virgules)
        </label>
        <input
          type="text"
          value={motsClesTexte}
          onChange={(e) => setMotsClesTexte(e.target.value)}
          placeholder="travaux, route, construction"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F2A4A]"
        />
      </div>

      {domaines.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Secteurs</label>
          <div className="flex flex-wrap gap-2">
            {domaines.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDomaine(d.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  domaineIds.includes(d.id)
                    ? 'border-[#0F2A4A] bg-[#0F2A4A] text-white'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                {d.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700 mb-1">Montant min (DH)</label>
          <input
            type="number"
            value={montantMin}
            onChange={(e) => setMontantMin(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F2A4A]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700 mb-1">Montant max (DH)</label>
          <input
            type="number"
            value={montantMax}
            onChange={(e) => setMontantMax(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F2A4A]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Canal</label>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value as typeof canal)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0F2A4A]"
        >
          <option value="email_et_inapp">Email + notification</option>
          <option value="email">Email uniquement</option>
          <option value="inapp">Notification uniquement</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={isPending}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-md bg-[#0F2A4A] px-3 py-2 text-sm font-medium text-white hover:bg-[#0F2A4A]/90 disabled:opacity-50"
        >
          {isPending ? 'Création...' : 'Créer le critère'}
        </button>
      </div>
    </div>
  )
}