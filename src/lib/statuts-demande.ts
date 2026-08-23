export type StatutDemande =
  | "en_attente"
  | "etude_dossier"
  | "en_discussion"
  | "revisions_proposees"
  | "en_validation"
  | "resolu";

export const STATUTS_ORDRE: StatutDemande[] = [
  "en_attente",
  "etude_dossier",
  "en_discussion",
  "revisions_proposees",
  "en_validation",
  "resolu",
];

export const STATUT_LABELS: Record<StatutDemande, string> = {
  en_attente: "En attente",
  etude_dossier: "Étude du dossier",
  en_discussion: "En discussion",
  revisions_proposees: "Révisions proposées",
  en_validation: "En validation",
  resolu: "Résolu",
};

export const STATUT_STYLES: Record<StatutDemande, string> = {
  en_attente: "bg-amber-50 text-amber-700 border-amber-200",
  etude_dossier: "bg-blue-50 text-blue-700 border-blue-200",
  en_discussion: "bg-purple-50 text-purple-700 border-purple-200",
  revisions_proposees: "bg-orange-50 text-orange-700 border-orange-200",
  en_validation: "bg-cyan-50 text-cyan-700 border-cyan-200",
  resolu: "bg-green-50 text-green-700 border-green-200",
};

export function getStatutSuivant(statut: StatutDemande): StatutDemande | null {
  const index = STATUTS_ORDRE.indexOf(statut);
  if (index === -1 || index === STATUTS_ORDRE.length - 1) return null;
  return STATUTS_ORDRE[index + 1];
}