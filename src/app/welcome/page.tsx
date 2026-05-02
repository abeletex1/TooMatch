import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeSlides from "./WelcomeSlides";

/**
 * Welcome — 4 slides educativas que explican el manifiesto de Too Match
 * antes de empezar el onboarding. Tras la última slide → /brand.
 *
 * Ruta protegida: solo usuarios autenticados.
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <WelcomeSlides />;
}
