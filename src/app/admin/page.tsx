import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import AdminMatchPanel from "./AdminMatchPanel";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) redirect("/match");

  // Todos los perfiles con onboarding completado
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, age, city, gender, seeking, photos")
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false });

  // Matches activos
  const { data: matches } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, created_at, unmatched_by")
    .order("created_at", { ascending: false });

  return (
    <MobileShell>
      <Topbar right="Admin" />
      <main className="flex-1 overflow-y-auto bg-bg-2 px-3 py-4">
        <AdminMatchPanel
          profiles={profiles ?? []}
          matches={matches ?? []}
        />
      </main>
    </MobileShell>
  );
}
