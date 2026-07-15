export default function RecherchePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Recherche & Filtrage</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Explorez les appels d&apos;offres actifs sur le marché marocain.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Filter panel — Catégorie > Domaine > Sous-domaine cascade,
            populated from marchespublics.gov.ma's sector taxonomy. */}
        <aside className="rounded-lg border border-[var(--color-border)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Filtres</h2>
          <div className="space-y-3 text-sm text-[var(--color-muted)]">
            <p>TODO: dropdown Catégorie</p>
            <p>TODO: dropdown Domaine (dépend de Catégorie)</p>
            <p>TODO: dropdown Sous-domaine (dépend de Domaine)</p>
            <p>TODO: région, montant min/max, statut</p>
          </div>
          <button className="mt-4 w-full rounded-md bg-[var(--color-navy)] px-3 py-2 text-sm font-medium text-white">
            Appliquer les filtres
          </button>
        </aside>

        <section className="col-span-3 rounded-lg border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-[var(--color-muted)]">
            TODO: liste de cartes résultats — query Supabase sur la table{" "}
            <code>tenders</code> jointe à <code>sous_domaines</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
