"use server";

import { createClient } from "@/lib/supabase/server";

export async function markMatchViewedAction(matchId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("matches")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .is("viewed_at", null);
}
