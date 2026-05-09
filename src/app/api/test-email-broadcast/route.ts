import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const results: { ok: number; failed: number } = { ok: 0, failed: 0 };

  for (const email of emails) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Too Match <hola@toomatch.app>",
        to: [email],
        subject: "✦ Tu primer match llega pronto — Too Match",
        html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E0D4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E0D4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#FAF7F2;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#A8A099;">Too Match</p>
            <p style="margin:6px 0 0;font-size:28px;color:#1E1B17;font-weight:500;line-height:1.2;">Tu match<br><em style="font-style:italic;color:#C4735A;">está cerca.</em></p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;text-align:center;">
            <p style="margin:0 0 24px;font-size:14px;color:#6B6258;font-family:Arial,sans-serif;line-height:1.6;font-weight:300;">
              Gracias por estar en Too Match. Cada día trabajamos para encontrarte a alguien que de verdad encaje contigo — sin scroll, sin prisa.
            </p>
            <a href="https://www.toomatch.app/match"
               style="display:inline-block;background:#C4735A;color:#FAF7F2;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:500;padding:13px 28px;border-radius:100px;">
              Ver mi match →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:0.5px solid #E8E0D4;">
            <p style="margin:0;font-size:11px;color:#A8A099;font-family:Arial,sans-serif;">
              Stop likes. Start match. · <a href="https://www.toomatch.app" style="color:#A8A099;">toomatch.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    if (res.ok) results.ok++;
    else results.failed++;
  }

  return NextResponse.json({ ...results, total: emails.length });
}
