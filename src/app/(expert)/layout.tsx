import { ExpertSidebar } from "@/components/layout/ExpertSidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

export default async function ExpertLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Expert";

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
      <ExpertSidebar />
      <div className="flex flex-1 flex-col">
        <Header companyName="Expert Safqa" userName={userName} />
        <main className="flex-1 bg-[var(--background)] p-6">{children}</main>
      </div>
    </div>
  );
}