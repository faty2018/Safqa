import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ("use client").
// Reads the public (anon) key — never put the service role key here.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
