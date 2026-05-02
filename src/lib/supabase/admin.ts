import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con service_role key.
 * Bypasses RLS — usar SOLO en server actions/server components verificando
 * que el usuario está autenticado con el cliente normal primero.
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local (no empieces con NEXT_PUBLIC_).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
