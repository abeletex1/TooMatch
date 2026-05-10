import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntroForm from "./IntroForm";

export default async function IntroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect("/match");

  return <IntroForm />;
}
