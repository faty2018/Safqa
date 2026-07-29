'use client'

import { useState, useTransition } from 'react'
import { inviterMembre, changerRoleMembre, retirerMembre } from '@/lib/actions/membres'

const ROLES = ['administrateur', 'bid_manager', 'analyste'] as const

export default function MembresEquipe({
  membres,
  currentUserId,
  entrepriseId,
}: {
  membres: any[]
  currentUserId: string
  entrepriseId: string
}) {
  const [list, setList] = useState(membres)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<typeof ROLES[number]>('analyste')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function changerRole(userId: string, role: string) {
    startTransition(async () => {
      const res = await changerRoleMembre({ utilisateurId: userId, nouveauRole: role as any })
      if (res.error) alert(res.error)
      else setList((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)))
    })
  }

  function retirer(userId: string) {
    if (!confirm("Retirer ce membre de l'entreprise ?")) return
    startTransition(async () => {
      const res = await retirerMembre(userId)
      if (res.error) alert(res.error)
      else setList((prev) => prev.filter((m) => m.id !== userId))
    })
  }

  function inviter() {
    setInviteMsg(null)
    startTransition(async () => {
      const res = await inviterMembre({ email: inviteEmail, role: inviteRole, entrepriseId })
      if (res.error) {
        setInviteMsg(res.error)
        return
      }
      setInviteMsg('Invitation envoyée ✓')
      setInviteEmail('')
      setList((prev) => [...prev, res.utilisateur])
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-medium text-slate-900 mb-4">Inviter un membre</h2>
        <div className="flex gap-3">
          <input
            placeholder="email@entreprise.ma"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={inviter}
            disabled={isPending || !inviteEmail}
            className="bg-[#0F2A4A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '...' : 'Inviter'}
          </button>
        </div>
        {inviteMsg && <p className="text-sm text-slate-500 mt-2">{inviteMsg}</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {list.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{m.nom}</p>
              <p className="text-xs text-slate-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={m.role}
                disabled={m.id === currentUserId || isPending}
                onChange={(e) => changerRole(m.id, e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs disabled:bg-slate-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {m.id !== currentUserId && (
                <button
                  onClick={() => retirer(m.id)}
                  disabled={isPending}
                  className="text-xs text-red-600 hover:underline"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}