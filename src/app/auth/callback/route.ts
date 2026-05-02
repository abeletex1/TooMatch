import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Endpoint que reciben los enlaces de email (confirmación, magic links,
 * OAuth). Supabase envía un `code` de un solo uso; aquí lo intercambiamos
 * por una sesión real (cookie en el dominio del usuario).
 *
 * Si todo va bien → redirige al `next` (por defecto /welcome).
 * Si falla → /auth/error con un mensaje amable.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/welcome";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
