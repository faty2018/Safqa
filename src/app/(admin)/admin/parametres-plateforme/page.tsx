import { createClient } from "@/lib/supabase/server";
import { ProfilForm } from "@/components/profil/ProfilForm";

export default async function AdminProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profil: { nom: string; email: string; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("staff_safqa")
      .select("nom, email, role")
      .eq("id", user.id)
      .single();
    profil = data;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Mon profil</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Informations de votre compte administrateur.
      </p>

      <div className="mt-6 max-w-md">
        <ProfilForm
          nom={profil?.nom ?? ""}
          email={profil?.email ?? ""}
          role="Super Admin"
          updateAction="admin"
        />
      </div>
    </div>
  );
}