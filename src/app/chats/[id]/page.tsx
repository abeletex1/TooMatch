import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildRealMatch, type MatchRow, type ProfileRow, type MessageRow } from "@/lib/types";
import ChatConversation from "./ChatConversation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Obtener match verificando que el usuario sea participante
  const { data: matchRow } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!matchRow) notFound();

  const partnerId =
    matchRow.user1_id === user.id ? matchRow.user2_id : matchRow.user1_id;

  // Perfiles + mensajes iniciales (últimos 100) en paralelo
  const [
    { data: partnerProfile },
    { data: myProfile },
    { data: initialMessages },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", partnerId).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  if (!partnerProfile || !myProfile) notFound();

  const messages = (initialMessages ?? []) as MessageRow[];
  const match = buildRealMatch(
    matchRow as MatchRow,
    myProfile as ProfileRow,
    partnerProfile as ProfileRow,
    messages.length
  );

  return (
    <ChatConversation
      match={match}
      currentUserId={user.id}
      initialMessages={messages}
      isUnmatched={!!matchRow.unmatched_by}
    />
  );
}
