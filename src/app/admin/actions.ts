"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/match");
  return user;
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createMatchAction(
  user1Id: string,
  user2Id: string
): Promise<{ error?: string }> {
  await assertAdmin();

  const admin = getServiceClient();

  // Comprobar que no existe ya un match entre estos dos (activo o pasado)
  const { data: existing } = await admin
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .is("unmatched_by", null)
    .maybeSingle();

  if (existing) return { error: "Ya existe un match activo entre estas dos personas." };

  const { error } = await admin.from("matches").insert({
    user1_id: user1Id,
    user2_id: user2Id,
  });

  if (error) return { error: error.message };
  return {};
}

export async function deleteMatchAction(
  matchId: string
): Promise<{ error?: string }> {
  await assertAdmin();

  const admin = getServiceClient();

  const { error } = await admin
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (error) return { error: error.message };
  return {};
}
