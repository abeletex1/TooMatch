import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "./OnboardingFlow";

/**
 * Onboarding — 5 pasos donde el usuario completa su perfil. Al terminar,
 * la action saveProfileAction guarda todo en `profiles` y redirige a /day-0.
 *
 * Si no hay sesión → /login.
 * Si el usuario YA terminó el onboarding → /match (no rehace).
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, gender, seeking, age")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/match");

  return (
    <OnboardingFlow
      initialGender={(profile?.gender as "male" | "female" | "other" | null) ?? null}
      initialSeeking={(profile?.seeking as "male" | "female" | "both" | null) ?? null}
      initialAge={profile?.age ?? 28}
    />
  );
}
