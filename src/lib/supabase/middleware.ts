import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs on every request. Refreshes the Supabase session cookie so it
// doesn't silently expire, and gives us a place to redirect based on
// auth state (see proxy.ts at the project root).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isPublicRoute = isAuthRoute;

  // Pas connecté et route protégée → login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Connecté : on détermine si c'est un compte staff (Admin/Expert Safqa)
  // ou un compte client (Entreprise), pour rediriger vers la bonne zone.
  let staffRole: "super_admin" | "expert" | null = null;

  if (user) {
    const { data: staff } = await supabase
      .from("staff_safqa")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    staffRole = staff?.role ?? null;
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isExpertRoute = pathname.startsWith("/expert");
  const isClientRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/recherche") ||
    pathname.startsWith("/analyse-ia") ||
    pathname.startsWith("/reponses") ||
    pathname.startsWith("/assistance-experts") ||
    pathname.startsWith("/alertes") ||
    pathname.startsWith("/parametres");

  // Connecté + sur une route auth → redirige vers son espace
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    if (staffRole === "super_admin") url.pathname = "/admin/dashboard";
    else if (staffRole === "expert") url.pathname = "/expert/dashboard";
    else url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Compte staff qui essaie d'aller sur les routes Entreprise → renvoyé chez lui
  if (user && staffRole && isClientRoute) {
    const url = request.nextUrl.clone();
    url.pathname = staffRole === "super_admin" ? "/admin/dashboard" : "/expert/dashboard";
    return NextResponse.redirect(url);
  }

  // Compte client (pas staff) qui essaie d'aller sur /admin ou /expert → renvoyé chez lui
  if (user && !staffRole && (isAdminRoute || isExpertRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Un expert qui essaie d'aller sur /admin, ou l'inverse
  if (user && staffRole === "expert" && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/expert/dashboard";
    return NextResponse.redirect(url);
  }
  if (user && staffRole === "super_admin" && isExpertRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}