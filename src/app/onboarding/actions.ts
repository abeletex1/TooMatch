"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export type OnboardingPayload = {
  self_description: string;
  partner_description: string;
  values: string[];
  gender: "male" | "female" | "other";
  seeking: "male" | "female" | "both";
  age: number;
  age_min: number;
  age_max: number;
  province: string;
  city: string;
  photos: string[];
};

export type SaveResult = { error?: string };

export async function saveProfileAction(
  payload: OnboardingPayload
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No hay sesión activa." };

  if (payload.self_description.trim().length < 30)
    return { error: "La descripción de ti es demasiado corta." };
  if (payload.partner_description.trim().length < 30)
    return { error: "La descripción de lo que buscas es demasiado corta." };
  if (payload.values.length < 1)
    return { error: "Selecciona al menos un valor." };
  if (payload.age_min >= payload.age_max)
    return { error: "El rango de edad no es válido." };

  // Generar display_name del email si no existe ya
  const { data: existing } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName =
    existing?.display_name?.trim() ||
    capitalize(
      (user.email ?? "usuario").split("@")[0].replace(/[._\-+]/g, " ")
    );

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
      self_description: payload.self_description.trim(),
      partner_description: payload.partner_description.trim(),
      values: payload.values,
      gender: payload.gender,
      seeking: payload.seeking,
      age: payload.age,
      age_min: payload.age_min,
      age_max: payload.age_max,
      province: payload.province,
      city: payload.city,
      photos: payload.photos,
      onboarding_completed: true,
      day_number: 0,
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: `No se pudo guardar el perfil: ${error.message}` };

  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "es";

  // Guardar locale en perfil para emails futuros
  await supabase.from("profiles").update({ locale }).eq("user_id", user.id);

  if (user.email) await sendWelcomeEmail(user.email, locale);

  redirect("/day-0");
}

function capitalize(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .trim();
}
