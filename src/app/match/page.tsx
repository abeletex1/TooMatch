import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllActiveMatches } from "@/lib/matching";
import MatchPageClient from "./MatchPageClient";

export default async function MatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, day_number, event_tag")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/welcome");

  // Usuarios de Factorial ven pantalla de espera hasta el día del evento
  const FACTS_DAY = new Date("2026-05-22T00:00:00");
  const isFactorialWaiting =
    profile.event_tag === "factorial" && new Date() < FACTS_DAY;

  const matches = isFactorialWaiting ? [] : await getAllActiveMatches(user.id);

  return (
    <MatchPageClient
      matches={matches}
      dayNumber={profile.day_number || 1}
      factorialWaiting={isFactorialWaiting}
    />
  );
}
