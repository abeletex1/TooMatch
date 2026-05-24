import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import ScrollLayout from "@/components/ui/ScrollLayout";
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

  const t = await getTranslations("chats");

  // 1. Obtener todos los matches del usuario
  const { data: matches } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is("unmatched_by", null)
    .order("created_at", { ascending: false });

  if (!matches || matches.length === 0) {
    return (
      <MobileShell>
        <ScrollLayout>
          <ChatsListClient chats={[]} />
        </ScrollLayout>
      </MobileShell>
    );
  }

  const matchIds = matches.map((m) => m.id);
  const partnerIds = matches.map((m) =>
    m.user1_id === user.id ? m.user2_id : m.user1_id
  );

  // 2. Tres queries en paralelo en vez de N*4 queries en bucle
  const [
    { data: partnerProfiles },
    { data: allMessages },
  ] = await Promise.all([
    // Query A: todos los perfiles de los partners de una vez
    supabase
      .from("profiles")
      .select("user_id, display_name, photos")
      .in("user_id", partnerIds),

    // Query B: todos los mensajes de todos los chats de una vez
    supabase
      .from("messages")
      .select("match_id, content, created_at, sender_id")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false }),
  ]);

  // Indexar perfiles por user_id para acceso O(1)
  const profileByUserId = Object.fromEntries(
    (partnerProfiles ?? []).map((p) => [p.user_id, p])
  );

  // Calcular por match: último mensaje, conteo de mensajes por sender
  const lastMsgByMatch: Record<string, typeof allMessages extends (infer T)[] | null ? T : never> = {};
  const msgCountByMatchAndSender: Record<string, Record<string, number>> = {};

  for (const msg of allMessages ?? []) {
    // Último mensaje (los mensajes vienen ordenados desc, el primero es el último)
    if (!lastMsgByMatch[msg.match_id]) {
      lastMsgByMatch[msg.match_id] = msg;
    }
    // Conteo por sender
    if (!msgCountByMatchAndSender[msg.match_id]) {
      msgCountByMatchAndSender[msg.match_id] = {};
    }
    msgCountByMatchAndSender[msg.match_id][msg.sender_id] =
      (msgCountByMatchAndSender[msg.match_id][msg.sender_id] ?? 0) + 1;
  }

  // Construir la lista de chats
  const chats: ChatRow[] = matches.map((m) => {
    const partnerId = m.user1_id === user.id ? m.user2_id : m.user1_id;
    const partnerProfile = profileByUserId[partnerId];
    const lastMsg = lastMsgByMatch[m.id];
    const counts = msgCountByMatchAndSender[m.id] ?? {};
    const myMsgCount = counts[user.id] ?? 0;
    const partnerMsgCount = counts[partnerId] ?? 0;
    const nameVisible = myMsgCount >= 1 && partnerMsgCount >= 1;
    const rawName = partnerProfile?.display_name?.trim() || "Perfil";

    const preview = lastMsg
      ? lastMsg.sender_id === user.id
        ? `${t("youPrefix")}${lastMsg.content}`
        : lastMsg.content
      : t("noMessages");

    const time = new Date(
      lastMsg ? lastMsg.created_at : m.created_at
    ).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    const hasUnread = !!lastMsg && lastMsg.sender_id !== user.id;

    return {
      id: m.id,
      initial: nameVisible ? rawName.charAt(0).toUpperCase() : "?",
      photoUrl: partnerProfile?.photos?.[0],
      name: rawName,
      nameVisible,
      preview,
      time,
      hasUnread,
    };
  });

  return (
    <MobileShell>
      <ScrollLayout>
        <ChatsListClient chats={chats} />
      </ScrollLayout>
    </MobileShell>
  );
}
