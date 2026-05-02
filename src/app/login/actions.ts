"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";

export type LoginState = { error?: string } | null;

/**
 * Inicia sesión con email + password en Supabase.
 *
 * Tras éxito, decide a dónde mandar al usuario:
 *   - Si todavía no terminó el onboarding → /welcome (para retomar el flujo)
 *   - Si ya lo terminó → /match
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduce tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const next = await getPostAuthRedirect();
  redirect(next);
}
