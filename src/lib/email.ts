"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const FROM = "Too Match <hola@toomatch.app>";
const API_URL = "https://api.resend.com/emails";

type EmailPayload = {
  subject: string;
  html: string;
};

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function sendEmail(to: string, payload: EmailPayload): Promise<void> {
  await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
}

function emailTemplate(title: string, body: string, ctaText: string, ctaUrl: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.toomatch.app";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E0D4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E0D4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#FAF7F2;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:#FAF7F2;padding:32px 32px 0;text-align:center;">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#A8A099;">Too Match</p>
            <p style="margin:6px 0 0;font-size:28px;color:#1E1B17;font-weight:500;line-height:1.2;">${title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;text-align:center;">
            <p style="margin:0 0 28px;font-size:14px;color:#6B6258;font-family:Arial,sans-serif;line-height:1.6;font-weight:300;">${body}</p>
            <a href="${base}${ctaUrl}"
               style="display:inline-block;background:#C4735A;color:#FAF7F2;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:500;padding:13px 28px;border-radius:100px;">
              ${ctaText}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:0.5px solid #E8E0D4;">
            <p style="margin:0;font-size:11px;color:#A8A099;font-family:Arial,sans-serif;">
              Stop likes. Start match. · <a href="${base}/profile" style="color:#A8A099;">Gestionar notificaciones</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMatchEmail(userId: string): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendEmail(email, {
    subject: "✦ Tienes un nuevo match en Too Match",
    html: emailTemplate(
      "Nuevo match.",
      "Hemos encontrado a alguien compatible contigo. Entra para descubrir quién es.",
      "Ver mi match →",
      "/match"
    ),
  });
}

export async function sendMessageEmail(
  userId: string,
  senderName: string,
  preview: string,
  matchId: string
): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendEmail(email, {
    subject: `Nuevo mensaje de ${senderName}`,
    html: emailTemplate(
      `${senderName} te ha escrito.`,
      preview.length > 80 ? preview.slice(0, 77) + "…" : preview,
      "Responder →",
      `/chats/${matchId}`
    ),
  });
}
