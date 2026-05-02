import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import BottomNav from "@/components/ui/BottomNav";
import Topbar from "@/components/ui/Topbar";
import ChatsListClient, { type ChatRow } from "./ChatsListClient";

export default async function ChatsPage() {
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
  if (!profile?.onboarding_completed) redirect("/welcome");

  // Obtener matches activos (no deshechos) del usuario
  const { data: matches } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is("unmatched_by", null)
    .order("created_at", { ascending: false });

  const chats: ChatRow[] = [];

  for (const m of matches ?? []) {
    const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id;

    // Perfil del partner + último mensaje en paralelo
    const [{ data: partnerProfile }, { data: lastMsgs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, photos")
        .eq("user_id", partnerId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const name = partnerProfile?.display_name?.trim() || "Perfil";
    const lastMsg = lastMsgs?.[0];
    const preview = lastMsg
      ? lastMsg.sender_id === user.id
        ? `Tú: ${lastMsg.content}`
        : lastMsg.content
      : "Aún no hay mensajes";

    const time = lastMsg
      ? new Date(lastMsg.created_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date(m.created_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });

    chats.push({
      id: m.id,
      initial: name.charAt(0).toUpperCase(),
      photoUrl: partnerProfile?.photos?.[0],
      name,
      preview,
      time,
    });
  }

  return (
    <MobileShell>
      <Topbar />

      <main className="flex-1 overflow-y-auto">
        <ChatsListClient chats={chats} />
      </main>

      <BottomNav />
    </MobileShell>
  );
}
