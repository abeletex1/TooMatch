"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string } | null;

/**
 * Crea una cuenta con email + password.
 *
 * Flujo:
 *  1. supabase.auth.signUp envía un email de confirmación al usuario.
 *  2. emailRedirectTo le dice a Supabase: "cuando el usuario haga clic
 *     en el enlace, redirígelo aquí con un ?code=..."
 *  3. /auth/callback (route handler) intercambia ese code por una sesión.
 *
 * Aquí, tras llamar a signUp, redirigimos al usuario a /signup/check-email
 * para que sepa que tiene que ir a su correo.
 */
export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (!email) return { error: "Introduce tu correo." };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "La contraseña debe tener al menos una letra mayúscula." };
  }
  if (password !== passwordConfirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Construye la URL pública del sitio para que Supabase sepa a dónde
  // mandar al usuario tras hacer clic en el email.
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/welcome`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Este correo ya está registrado. Inicia sesión." };
    }
    return { error: error.message };
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}
