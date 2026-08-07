import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { getNombreNotificationsNonLues } from "@/lib/actions/notifications";

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
      const entreprise = Array.isArray(profile.entreprises)
        ? profile.entreprises[0]
        : profile.entreprises;
      companyName = entreprise?.raison_sociale ?? "";
    }
  }

  const nombreNonLues = await getNombreNotificationsNonLues();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header companyName={companyName} userName={userName} nombreNotificationsNonLues={nombreNonLues} />
        <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}