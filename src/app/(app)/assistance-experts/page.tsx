import { listerMesDemandes } from "@/lib/actions/demandes-experts";
import { AssistanceExpertsClient } from "@/components/assistance-experts/AssistanceExpertsClient";
import { one } from "@/lib/normalise";

export default async function AssistanceExpertsPage() {
  const { data: demandes, error } = await listerMesDemandes();

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des demandes : {error}
      </div>
    );
  }
  const demandesNormalisees = (demandes ?? []).map((d: any) => ({
    ...d,
    staff_safqa: one(d.staff_safqa),
  }));
  return <AssistanceExpertsClient demandesInitiales={demandesNormalisees} />;
}