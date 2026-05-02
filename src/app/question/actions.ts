"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveAnswerAction(
  questionId: string,
  answer: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };

  const { error } = await supabase.from("daily_answers").upsert(
    { user_id: user.id, question_id: questionId, answer },
    { onConflict: "user_id,question_id" }
  );

  if (error) return { error: error.message };
  return {};
}
