"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveRelationshipIntentAction(
  intent: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({ relationship_intent: intent })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
