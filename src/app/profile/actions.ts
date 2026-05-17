"use server";

import { createClient } from "@/lib/supabase/server";

type ProfileFields = Partial<{
  display_name: string;
  self_description: string;
  partner_description: string;
  values: string[];
  gender: "male" | "female" | "other";
  seeking: "male" | "female" | "both";
  age: number;
  age_min: number;
  age_max: number;
  distance_km: number;
  city: string;
  photos: string[];
}>;

export async function updateProfileAction(
  fields: ProfileFields
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión." };

  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function resetOnboardingAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      onboarding_completed: false,
      display_name: null,
      self_description: null,
      partner_description: null,
      values: [],
      gender: null,
      seeking: null,
      age: null,
      age_min: 18,
      age_max: 60,
      distance_km: 50,
      city: null,
      photos: [],
      relationship_intent: null,
    })
    .eq("user_id", user.id);

  const { redirect } = await import("next/navigation");
  redirect("/welcome");
}
