import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

// L'auth est déjà vérifiée par proxy.ts (redirige vers /login si pas
// connecté), donc ici `user` est garanti non-null en pratique. On refait
// quand même l'appel côté serveur pour récupérer nom/entreprise à afficher.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Utilisateur";
  let companyName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("utilisateurs")
      .select("nom, entreprises(raison_sociale)")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = profile.nom;
      // La jointure Supabase renvoie un objet (ou tableau selon la relation) — on gère les deux.
      const entreprise = Array.isArray(profile.entreprises)
        ? profile.entreprises[0]
        : profile.entreprises;
      companyName = entreprise?.raison_sociale ?? "";
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header companyName={companyName} userName={userName} />
        <main className="flex-1 bg-[var(--background)] p-6">{children}</main>
      </div>
    </div>
  );
}