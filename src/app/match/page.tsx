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
    .select("onboarding_completed, day_number")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/welcome");

  const matches = await getAllActiveMatches(user.id);

  return (
    <MatchPageClient
      matches={matches}
      dayNumber={profile.day_number || 1}
    />
  );
}
