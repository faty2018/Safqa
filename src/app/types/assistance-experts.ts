import type { StatutDemande } from "@/lib/statuts-demande";

export type { StatutDemande };

export interface Demande {
  id: string;
  sujet: string;
  description: string;
  statut: StatutDemande;
  created_at: string;
  ao_id?: string | null;
  expert_id: string | null;
  entreprises?: { raison_sociale: string } | null;
  staff_safqa?: { nom: string } | null;
}

export interface Message {
  id: string;
  auteur_type: "utilisateur" | "expert";
  contenu: string;
  created_at: string;
  utilisateurs: { nom: string } | null;
  staff_safqa: { nom: string } | null;
}
