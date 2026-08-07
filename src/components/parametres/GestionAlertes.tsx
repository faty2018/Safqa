'use client'

import { useEffect, useState, useTransition } from 'react'
import { getCriteres, getDomaines, supprimerCritere, toggleActifCritere } from '@/lib/actions/alertes-criteres'
import type { AlerteCritere } from '@/lib/types'
import FormulaireCritere from './FormulaireCritere'

export default function GestionAlertes() {
  const [criteres, setCriteres] = useState<AlerteCritere[]>([])
  const [domaines, setDomaines] = useState<{ id: string; nom: string }[]>([])
  const [showFormulaire, setShowFormulaire] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function charger() {
    setLoading(true)
    const [c, d] = await Promise.all([getCriteres(), getDomaines()])
    setCriteres(c)
    setDomaines(d)
    setLoading(false)
  }

  useEffect(() => {
    charger()
  }, [])

  function handleSupprimer(id: string) {
    if (!confirm('Supprimer ce critère ?')) return
    startTransition(async () => {
      await supprimerCritere(id)
      charger()
    })
  }

  function handleToggle(id: string, actif: boolean) {
    startTransition(async () => {
      await toggleActifCritere(id, !actif)
      charger()
    })
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-900">Mes critères d&apos;alerte</h3>
          <p className="text-sm text-slate-500">
            Recevez une notification quand un nouvel AO correspond à vos critères.
          </p>
        </div>
        <button
          onClick={() => setShowFormulaire(true)}
          className="rounded-md bg-[#0F2A4A] px-3 py-2 text-sm font-medium text-white hover:bg-[#0F2A4A]/90"
        >
          Nouveau critère
        </button>
      </div>

      {showFormulaire && (
        <FormulaireCritere
          domaines={domaines}
          onClose={() => setShowFormulaire(false)}
          onCreated={() => {
            setShowFormulaire(false)
            charger()
          }}
        />
      )}

      {criteres.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun critère créé pour le moment.</p>
      ) : (
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {criteres.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{c.nom}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {c.motsCles.length > 0 && `Mots-clés : ${c.motsCles.join(', ')}`}
                  {c.montantMin != null && ` · Min : ${c.montantMin.toLocaleString('fr-FR')} DH`}
                  {c.montantMax != null && ` · Max : ${c.montantMax.toLocaleString('fr-FR')} DH`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(c.id, c.actif)}
                  disabled={isPending}
                  className={`text-xs font-medium ${c.actif ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                  {c.actif ? 'Actif' : 'Inactif'}
                </button>
                <button
                  onClick={() => handleSupprimer(c.id)}
                  disabled={isPending}
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}