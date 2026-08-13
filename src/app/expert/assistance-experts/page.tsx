import { listerDemandesStaff } from "@/lib/actions/demandes-experts";
import { ExpertDemandesClient } from "@/components/assistance-experts/ExpertDemandesClient";

export default async function ExpertAssistanceExpertsPage() {
  const { data: demandes, error } = await listerDemandesStaff();

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des demandes : {error}
      </div>
    );
  }

  return <ExpertDemandesClient demandesInitiales={demandes ?? []} />;
}