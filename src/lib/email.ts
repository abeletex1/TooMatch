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
  const res = await fetch(API_URL, {
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
  if (!res.ok) throw new Error(`Resend error ${res.status} for ${to}`);
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
            <p style="margin:0;font-size:11px;color:#A8A099;font-family:Arial,sans-serif;line-height:1.6;">
              Stop likes. Start match.<br/>Si este email te ha llegado a spam, márcanos como "No es spam" — te enviaremos notificaciones importantes por aquí.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(userEmail: string, locale: string = "es"): Promise<void> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.toomatch.app";
  const isEn = locale === "en";

  if (isEn) {
    await sendEmail(userEmail, {
      subject: "Welcome to Too Match. This is not Tinder.",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Too Match</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-family:'Georgia',serif;font-size:28px;color:#1E1B17;letter-spacing:2px;">T<span style="color:#6B8C7E;font-size:32px;">∞</span></p>
              <p style="margin:4px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:6px;color:#A8A099;text-transform:uppercase;">MATCH</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;border:0.5px solid #E8E0D4;padding:44px 40px;">
              <p style="margin:0 0 32px 0;font-family:'Georgia',serif;font-size:22px;font-weight:normal;color:#1E1B17;line-height:1.3;">
                Welcome to Too Match.<br/>
                <em style="color:#C4735A;">This is not Tinder.</em>
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                <strong style="color:#1E1B17;font-weight:700;">No likes here.</strong><br/>
                No swiping.<br/>
                No infinite scroll.
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                We are not designed to waste your time.
              </p>
              <div style="height:1px;background-color:#F2EDE4;margin:24px 0;"></div>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Traditional dating apps win when <strong style="color:#1E1B17;font-weight:600;">you don't find anyone</strong>.<br/>
                The longer you stay, the better for them.
              </p>
              <p style="margin:0 0 24px 0;font-family:'Georgia',serif;font-size:18px;font-style:italic;color:#C4735A;line-height:1.4;">
                Not here.
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Too Match exists for the opposite: to help you find <strong style="color:#1E1B17;font-weight:600;">the right person</strong> as soon as possible — and never come back.
              </p>
              <div style="height:1px;background-color:#F2EDE4;margin:24px 0;"></div>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                You'll receive matches based on <strong style="color:#C4735A;font-weight:600;">real compatibility</strong>, not who gets the most attention.<br/>
                No posturing. No algorithms designed to keep you hooked.
              </p>
              <p style="margin:0 0 32px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Do your part, and the system will do the rest.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${base}/match"
                      style="display:inline-block;background-color:#1E1B17;color:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:400;letter-spacing:1px;text-decoration:none;padding:14px 36px;border-radius:12px;">
                      Open Too Match →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="height:1px;background-color:#F2EDE4;margin-bottom:24px;"></div>
              <p style="margin:0;font-family:'Georgia',serif;font-size:14px;font-style:italic;color:#A8A099;text-align:center;">
                — Too Match
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A8A099;font-weight:300;line-height:1.6;">
                Stop likes. Start match.<br/>
                If this email ended up in spam, mark it as "Not spam".
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
    return;
  }

  await sendEmail(userEmail, {
    subject: "Bienvenido a Too Match. Esto no es Tinder.",
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Too Match</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <p style="margin:0;font-family:'Georgia',serif;font-size:28px;color:#1E1B17;letter-spacing:2px;">T<span style="color:#6B8C7E;font-size:32px;">∞</span></p>
              <p style="margin:4px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:6px;color:#A8A099;text-transform:uppercase;">MATCH</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;border:0.5px solid #E8E0D4;padding:44px 40px;">
              <p style="margin:0 0 32px 0;font-family:'Georgia',serif;font-size:22px;font-weight:normal;color:#1E1B17;line-height:1.3;">
                Te damos la bienvenida a Too Match.<br/>
                <em style="color:#C4735A;">Esto no es Tinder.</em>
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                <strong style="color:#1E1B17;font-weight:700;">Aquí no hay likes.</strong><br/>
                No hay swipe.<br/>
                No hay scroll infinito.
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Y no estamos diseñados para que pierdas el tiempo.
              </p>
              <div style="height:1px;background-color:#F2EDE4;margin:24px 0;"></div>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Las apps de citas tradicionales ganan cuando <strong style="color:#1E1B17;font-weight:600;">no encuentras a nadie</strong>.<br/>
                Cuanto más tiempo pasas ahí, mejor para ellas.
              </p>
              <p style="margin:0 0 24px 0;font-family:'Georgia',serif;font-size:18px;font-style:italic;color:#C4735A;line-height:1.4;">
                Aquí no.
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Too Match existe para lo contrario: que encuentres a <strong style="color:#1E1B17;font-weight:600;">la persona adecuada</strong> lo antes posible y no tengas que volver.
              </p>
              <div style="height:1px;background-color:#F2EDE4;margin:24px 0;"></div>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Recibirás matches basados en <strong style="color:#C4735A;font-weight:600;">compatibilidad real</strong>, no en quién consigue más atención.<br/>
                Sin postureo. Sin algoritmos diseñados para engancharte.
              </p>
              <p style="margin:0 0 16px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Si haces tu parte, el sistema hará la suya.<br/>
                Y, conforme pase el tiempo, <strong style="color:#1E1B17;font-weight:600;">mayores probabilidades tendrás de salir con pareja</strong>.
              </p>
              <p style="margin:0 0 32px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:300;color:#6B6258;line-height:1.8;">
                Si funciona como debe, no solo te irás.<br/>
                Lo recomendarás, ayudándote <strong style="color:#1E1B17;font-weight:600;">no solo a ti, sino también a mucha gente</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${base}/match"
                      style="display:inline-block;background-color:#1E1B17;color:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:400;letter-spacing:1px;text-decoration:none;padding:14px 36px;border-radius:12px;">
                      Entra a Too Match →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="height:1px;background-color:#F2EDE4;margin-bottom:24px;"></div>
              <p style="margin:0;font-family:'Georgia',serif;font-size:14px;font-style:italic;color:#A8A099;text-align:center;">
                — Too Match
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#A8A099;font-weight:300;line-height:1.6;">
                Stop likes. Start match.<br/>
                Si este email te ha llegado a spam, márcanos como "No es spam".
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export async function sendMatchEmail(userId: string): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;

  // Leer idioma del perfil
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("locale")
    .eq("user_id", userId)
    .maybeSingle();
  const isEn = (profile?.locale ?? "es") === "en";

  await sendEmail(email, isEn ? {
    subject: "✦ You have a new match on Too Match",
    html: emailTemplate(
      "You have a new match.",
      "Someone compatible with you is waiting. Open the app, say hello and find out who they are.",
      "Discover my match →",
      "/match"
    ),
  } : {
    subject: "✦ Tienes un nuevo match en Too Match",
    html: emailTemplate(
      "Tienes un nuevo match.",
      "Alguien compatible contigo está esperando. Entra, escríbele y descubre quién es.",
      "Ver mi match →",
      "/match"
    ),
  });
}

export async function sendMessageEmail(
  userId: string,
  matchId: string
): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) return;
  await sendEmail(email, {
    subject: "Tienes un nuevo mensaje en Too Match",
    html: emailTemplate(
      "Tienes un nuevo mensaje.",
      "Alguien te ha escrito. Entra para leerlo.",
      "Leer mensaje →",
      `/chats/${matchId}`
    ),
  });
}
