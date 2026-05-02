"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/match");
  return supabase;
}

export async function createMatchAction(
  user1Id: string,
  user2Id: string
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();

  // Comprobar que no existe ya un match activo entre estos dos
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .is("unmatched_by", null)
    .maybeSingle();

  if (existing) return { error: "Ya existe un match activo entre estas dos personas." };

  const { error } = await supabase.from("matches").insert({
    user1_id: user1Id,
    user2_id: user2Id,
  });

  if (error) return { error: error.message };
  return {};
}

export async function deleteMatchAction(
  matchId: string
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (error) return { error: error.message };
  return {};
}
