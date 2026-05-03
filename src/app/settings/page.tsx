import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isAdmin = user.email === (process.env.ADMIN_EMAIL ?? "abeletex1@gmail.com");

  return (
    <MobileShell>
      <main className="flex-1 overflow-y-auto">
        <SettingsClient email={user.email ?? ""} isAdmin={isAdmin} />
      </main>
    </MobileShell>
  );
}
