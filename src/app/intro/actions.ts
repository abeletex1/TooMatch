"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveIntroAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const display_name = (formData.get("display_name") as string)?.trim();
  const age = Number(formData.get("age"));
  const gender = formData.get("gender") as string;
  const seeking = formData.get("seeking") as string;

  if (!display_name) return { error: "Escribe tu nombre." };
  if (!age || age < 18 || age > 70) return { error: "Edad entre 18 y 70." };
  if (!gender) return { error: "Indica tu género." };
  if (!seeking) return { error: "Indica qué buscas." };

  const event_tag = (formData.get("event_tag") as string) || null;

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    display_name,
    age,
    gender,
    seeking,
    ...(event_tag ? { event_tag } : {}),
  }, { onConflict: "user_id" });

  if (error) return { error: error.message };
  return {};
}
