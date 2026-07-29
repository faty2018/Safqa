// Domain types — traduits directement du diagramme de classes
// (voir /supabase/schema.sql pour le schéma SQL correspondant).
//
// Note : "sous-domaine" n'est pas un type séparé. Un Domaine dont
// parent_id est rempli EST un sous-domaine. La hiérarchie complète
// (Catégorie -> Domaine -> sous-domaines) se construit en filtrant
// sur categorie_id puis en suivant parent_id.

export interface Categorie {
  id: string;
  nom: string; // ex: "Travaux", "Fournitures", "Services"
}

export interface Domaine {
  id: string;
  nom: string;
  categorieId: string;
  parentId: string | null; // null = domaine racine, sinon c'est un sous-domaine
}

export interface AO {
  id: string;
  reference: string;
  intitule: string;
  objet: string | null;
  acheteurPublic: string;
  montantEstime: number | null;
  dateLimiteRemisePlis: string | null; // ISO datetime
  lienSource: string | null;
  createdAt: string;
  statutAnalyse?: "non_analyse" | "terminee" | "echec" | "non_analysable";
}

export interface Entreprise {
  id: string;
  raisonSociale: string;
  ice: string;
  dateInscription: string; // ISO date
}

export type RoleUtilisateur = "administrateur" | "bid_manager" | "analyste";

export interface Utilisateur {
  id: string; // == auth.users.id côté Supabase
  entrepriseId: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
}

// Statut affiché dans l'UI (Dashboard, Recherche & Filtrage) —
// dérivé côté frontend à partir de dateLimiteRemisePlis, pas une
// colonne du diagramme de classes.
export type TenderStatus = "nouveau" | "en_cours" | "cloture";

export function deriveStatus(ao: AO): TenderStatus {
  if (!ao.dateLimiteRemisePlis) return "nouveau";
  const now = new Date();
  const limite = new Date(ao.dateLimiteRemisePlis);
  if (limite < now) return "cloture";
  const joursRestants = (limite.getTime() - now.getTime()) / 86_400_000;
  return joursRestants <= 7 ? "en_cours" : "nouveau";
}
