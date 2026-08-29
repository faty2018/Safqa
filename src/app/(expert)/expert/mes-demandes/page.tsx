import { listerDemandesActives } from "@/lib/actions/demandes-experts";
import { DemandesStaffTable } from "@/components/assistance-experts/DemandesStaffTable";
import { one } from "@/lib/normalise";

export default async function ExpertMesDemandesPage() {
  const { data: demandes, error } = await listerDemandesActives();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Mes demandes
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Demandes d&apos;assistance qui vous sont assignées.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-red-600">
          Erreur lors du chargement : {error}
        </p>
      ) : (
        <DemandesStaffTable
          demandesInitiales={(demandes ?? []).map((d: any) => ({
  ...d,
  entreprises: one(d.entreprises),
}))}
          emptyMessage="Aucune demande active pour le moment."
        />
      )}
    </div>
  );
}