import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

export const maxDuration = 300;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Obtener todos los usuarios
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const emails = users
    .map((u) => u.email)
    .filter((e): e is string => !!e);

  let ok = 0;
  const errors: string[] = [];
  for (let i = 0; i < emails.length; i++) {
    try {
      await sendWelcomeEmail(emails[i]);
      ok++;
    } catch (e: unknown) {
      errors.push(`${emails[i]}: ${e instanceof Error ? e.message : String(e)}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  return NextResponse.json({ ok, failed: errors.length, total: emails.length, errors });
}
