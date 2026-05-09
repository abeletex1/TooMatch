import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Day0Client from "./Day0Client";

export default async function Day0Page() {
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

  const nextHref = profile?.relationship_intent ? "/match" : "/onboarding-question";

  return <Day0Client nextHref={nextHref} />;
}
