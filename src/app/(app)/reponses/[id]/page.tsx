import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReponseEditor } from "@/components/reponses/ReponseEditor";

export default async function ReponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: reponse } = await supabase
    .from("reponses")
    .select("id, trame_json, statut, genere_le, ao_id, ao(intitule, reference, acheteur_public)")
    .eq("id", id)
    .single();

  if (!reponse) notFound();

  const ao = Array.isArray(reponse.ao) ? reponse.ao[0] : reponse.ao;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          {ao?.reference}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">{ao?.intitule}</h1>
        <p className="text-sm text-slate-500 mt-1">{ao?.acheteur_public}</p>
      </div>

      <ReponseEditor
        reponseId={reponse.id}
        trameInitiale={reponse.trame_json as any}
        statut={reponse.statut}
        aoReference={ao?.reference ?? ""}
        aoIntitule={ao?.intitule ?? ""}
      />
    </div>
  );
}