import { listerDemandesActives, listerHistorique } from "@/lib/actions/demandes-experts";
import { AdminDemandesClient } from "@/components/assistance-experts/AdminDemandesClient";

export default async function AdminAssistanceExpertsPage() {
  const [{ data: actives, error: erreurActives }, { data: historique, error: erreurHistorique }] =
    await Promise.all([listerDemandesActives(), listerHistorique()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Assistance experts
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Suivi des demandes d&apos;assistance et affectation aux experts.
      </p>

      {erreurActives || erreurHistorique ? (
        <p className="mt-6 text-sm text-red-600">
          Erreur lors du chargement : {erreurActives || erreurHistorique}
        </p>
      ) : (
        <AdminDemandesClient
          demandesActives={actives ?? []}
          demandesHistorique={historique ?? []}
        />
      )}
    </div>
  );
}