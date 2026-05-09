import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import IntroQuestion from "./IntroQuestion";

export default async function OnboardingQuestionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, relationship_intent")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/welcome");
  if (profile?.relationship_intent) redirect("/match");

  return (
    <MobileShell>
      <Topbar right="Día 0" />
      <main className="flex flex-1 flex-col px-7 pt-8 pb-7 overflow-y-auto">
        <IntroQuestion />
      </main>
    </MobileShell>
  );
}
