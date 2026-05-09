import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  // Solo el admin puede usar esto
  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Too Match <hola@toomatch.app>",
      to: [user.email],
      subject: "✦ Test de entregabilidad — Too Match",
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
            <p style="margin:6px 0 0;font-size:28px;color:#1E1B17;font-weight:500;line-height:1.2;">Email de prueba.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;text-align:center;">
            <p style="margin:0 0 8px;font-size:14px;color:#6B6258;font-family:Arial,sans-serif;line-height:1.6;font-weight:300;">
              Si estás leyendo esto en tu bandeja de entrada, el sistema de notificaciones por email funciona correctamente.
            </p>
            <p style="margin:0;font-size:12px;color:#A8A099;font-family:Arial,sans-serif;">Stop likes. Start match.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
