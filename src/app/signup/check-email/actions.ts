"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function resendConfirmationAction(
  email: string
): Promise<{ error?: string }> {
  if (!email) return { error: "Email no válido." };

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/welcome`,
    },
  });

  if (error) return { error: "No se pudo reenviar. Espera un momento e inténtalo de nuevo." };
  return {};
}
