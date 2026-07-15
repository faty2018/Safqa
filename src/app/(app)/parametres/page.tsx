export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Paramètres du compte</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Configurez votre entreprise, votre équipe et vos critères de veille.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Entreprise</h2>
          <p className="text-sm text-[var(--color-muted)]">
            TODO: infos entreprise (ICE, secteur, siège, effectif).
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Gestion d&apos;équipe</h2>
          <p className="text-sm text-[var(--color-muted)]">
            TODO: liste des membres, rôles, invitation (multi-tenant).
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Critères de veille automatisée</h2>
          <p className="text-sm text-[var(--color-muted)]">
            TODO: secteurs d&apos;activité, régions cibles, mots-clés d&apos;exclusion — utilisés
            par le module Analyse IA.
          </p>
        </div>
      </div>
    </div>
  );
}
