import { createClient } from "@/lib/supabase/server";
import { inviterMembre } from "@/lib/actions/membres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, role, entrepriseId } = await req.json();
  if (!email || !role || !entrepriseId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const res = await inviterMembre({ email, role, entrepriseId });
  if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json(res);
}