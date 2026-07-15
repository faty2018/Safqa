import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

// L'auth + le check "staff" sont déjà faits par proxy.ts.
// Ici on récupère juste le nom à afficher dans le Header.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Admin";

  if (user) {
    const { data: staff } = await supabase
      .from("staff_safqa")
      .select("nom")
      .eq("id", user.id)
      .single();

    if (staff) userName = staff.nom;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <Header companyName="Super Admin" userName={userName} />
        <main className="flex-1 bg-[var(--background)] p-6">{children}</main>
      </div>
    </div>
  );
}