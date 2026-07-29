'use client'

import { useState } from 'react'
import MonCompte from './MonCompte'
import ProfilEntreprise from './ProfilEntreprise'
import MembresEquipe from './MembresEquipe'

type Props = {
  currentUser: any
  entreprise: any
  membres: any[] | null
  isAdmin: boolean
}

export default function ParametresTabs({ currentUser, entreprise, membres, isAdmin }: Props) {
  const tabs = [
    { id: 'compte', label: 'Mon compte' },
    { id: 'entreprise', label: 'Profil entreprise' },
    ...(isAdmin ? [{ id: 'equipe', label: "Membres de l'équipe" }] : []),
  ] as const

  const [active, setActive] = useState<string>('compte')

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              active === tab.id
                ? 'border-[#0F2A4A] text-[#0F2A4A]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'compte' && <MonCompte currentUser={currentUser} />}
      {active === 'entreprise' && (
        <ProfilEntreprise entreprise={entreprise} isAdmin={isAdmin} />
      )}
      {active === 'equipe' && isAdmin && (
        <MembresEquipe
          membres={membres ?? []}
          currentUserId={currentUser.id}
          entrepriseId={currentUser.entreprise_id}
        />
      )}
    </div>
  )
}