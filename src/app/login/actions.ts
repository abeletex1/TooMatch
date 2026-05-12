"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { checkRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string } | null;

async function getIP(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getIP();
  // Máximo 10 intentos de login por IP cada 15 minutos
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduce tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const next = await getPostAuthRedirect();
  redirect(next);
}

export async function resetPasswordAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getIP();
  // Máximo 5 solicitudes de reset por IP cada hora
  const rl = checkRateLimit(`reset:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Demasiadas solicitudes. Espera una hora e inténtalo de nuevo." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Introduce tu correo." };

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "https://toomatch.app";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });

  if (error) return { error: error.message };
  return { error: undefined };
}
