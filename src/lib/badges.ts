"use server";

import { createClient } from "@/lib/supabase/server";

export type BadgeCounts = {
  unreadChats: number;
  hasNewMatch: boolean;
  hasUnansweredQuestion: boolean;
};

export async function getBadgeCounts(): Promise<BadgeCounts> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { unreadChats: 0, hasNewMatch: false, hasUnansweredQuestion: false };

  const { data: matches } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is("unmatched_by", null);

  let unreadChats = 0;
  let hasNewMatch = false;
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  for (const m of matches ?? []) {
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("sender_id, created_at")
      .eq("match_id", m.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastMsg) {
      if (m.created_at >= twoDaysAgo) hasNewMatch = true;
    } else if (lastMsg.sender_id !== user.id) {
      unreadChats++;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: question } = await supabase
    .from("daily_questions")
    .select("id")
    .lte("active_date", today)
    .order("active_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let hasUnansweredQuestion = false;
  if (question) {
    const { data: answer } = await supabase
      .from("daily_answers")
      .select("id")
      .eq("user_id", user.id)
      .eq("question_id", question.id)
      .maybeSingle();
    hasUnansweredQuestion = !answer;
  }

  return { unreadChats, hasNewMatch, hasUnansweredQuestion };
}
