import { createClient } from "@/lib/supabase/server";

/**
 * Decide a dónde mandar a un usuario autenticado tras un login:
 *   - Sin perfil o sin display_name → /intro (nombre, edad, género, busco)
 *   - Con intro pero sin onboarding_completed → /welcome
 *   - Con onboarding completado → /match
 */
export async function getPostAuthRedirect(): Promise<"/intro" | "/welcome" | "/day-0" | "/match" | "/login"> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_completed, display_name, day_number")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return "/intro";

  if (!profile?.display_name) return "/intro";

  if (!profile?.onboarding_completed) return "/welcome";

  // Si acaba de terminar el onboarding (día 0), mostrar day-0 con la petición de notificaciones
  if ((profile.day_number ?? 0) === 0) return "/day-0";

  return "/match";
}
