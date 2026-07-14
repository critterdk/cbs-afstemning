import { createClient } from "@supabase/supabase-js";

// Lazy initialization so the build doesn't crash if env vars are missing
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase service role env vars not configured");
  return createClient(url, key);
}
