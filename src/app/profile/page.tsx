import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import BottomNav from "@/components/ui/BottomNav";
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/welcome");

  return (
    <MobileShell>
      <main className="flex-1 overflow-y-auto">
        <ProfileEditor
          initial={{
            user_id: profile.user_id,
            display_name: profile.display_name ?? null,
            self_description: profile.self_description ?? null,
            partner_description: profile.partner_description ?? null,
            values: profile.values ?? [],
            gender: profile.gender ?? null,
            seeking: profile.seeking ?? null,
            age: profile.age ?? null,
            age_min: profile.age_min ?? 18,
            age_max: profile.age_max ?? 60,
            distance_km: profile.distance_km ?? 50,
            city: profile.city ?? null,
            photos: profile.photos ?? [],
          }}
          userEmail={user.email ?? ""}
        />
      </main>
      <BottomNav />
    </MobileShell>
  );
}
