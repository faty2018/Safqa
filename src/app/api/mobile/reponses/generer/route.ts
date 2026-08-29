import { createClientForToken } from "@/lib/supabase/server";
import { genererTrameReponse } from "@/lib/actions/reponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { aoId, forcerRegeneration } = await req.json();
  if (!aoId) return NextResponse.json({ error: "aoId manquant" }, { status: 400 });

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClientForToken(token);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const res = await genererTrameReponse(aoId, forcerRegeneration ?? false, supabase);
    return NextResponse.json(res);
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      const url = err.digest.split(";")[2];
      const reponseId = url?.split("/reponses/")[1];
      return NextResponse.json({ reponseId });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

