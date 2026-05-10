import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeSlides from "./WelcomeSlides";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.display_name) redirect("/intro");

  const firstName = profile.display_name.split(" ")[0];

  return <WelcomeSlides name={firstName} />;
}
