import { createClient } from "@/lib/supabase/server";

/**
 * Decide a dónde mandar a un usuario autenticado tras un login o al
 * entrar en la home:
 *   - Si todavía no terminó el onboarding (sin perfil o
 *     onboarding_completed = false) → /welcome
 *   - Si ya lo terminó → /match
 *
 * Si la consulta a la tabla profiles falla (ej. la tabla aún no existe en
 * Supabase), por seguridad asumimos que el onboarding no está hecho y
 * mandamos al usuario a /welcome.
 */
export async function getPostAuthRedirect(): Promise<"/welcome" | "/match" | "/login"> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Tabla profiles aún no existe o RLS bloquea — asumimos no-onboarded.
    return "/welcome";
  }

  if (!profile?.onboarding_completed) {
    return "/welcome";
  }

  return "/match";
}
