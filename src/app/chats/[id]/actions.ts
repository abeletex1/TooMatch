"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/** Inserta un nuevo mensaje en la conversación */
export async function sendMessageAction(
  matchId: string,
  content: string
): Promise<{ error?: string; messageId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Mensaje vacío." };
  if (trimmed.length > 1000) return { error: "Mensaje demasiado largo." };

  const { data: match } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, unmatched_by")
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!match) return { error: "Match no encontrado." };
  if (match.unmatched_by) return { error: "Este match ya fue deshecho." };

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: user.id, content: trimmed })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Notificar al partner
  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
  const admin = createAdminClient();
  const { data: myProfile } = await admin.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  const name = myProfile?.display_name?.split(" ")[0] ?? "Tu match";
  await sendPushToUser(partnerId, {
    title: `Nuevo mensaje de ${name}`,
    body: trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed,
    url: `/chats/${matchId}`,
    type: "message",
    senderName: name,
    matchId,
  });

  return { messageId: msg.id };
}

/** Deshace un match: guarda quién lo hizo y la razón */
export async function unmatchAction(
  matchId: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };

  const { error } = await supabase
    .from("matches")
    .update({ unmatched_by: user.id, unmatch_reason: reason })
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is("unmatched_by", null);

  if (error) return { error: error.message };
  return {};
}
