import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para componentes de navegador (Client Components).
 * Lee la URL y el anon key de variables NEXT_PUBLIC_* (públicas por diseño;
 * la seguridad real vive en las políticas Row Level Security de Supabase).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
