import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Too Match <hola@toomatch.app>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://too-match.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function matchEmail(toName: string, matchName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hoy te hemos conectado con ${matchName}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,serif;font-size:22px;color:#1E1B17;letter-spacing:0.05em;">T</span>
              <span style="font-size:18px;color:#6B8C7E;margin:0 2px;">∞</span>
              <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#1E1B17;letter-spacing:0.2em;font-weight:500;">MATCH</span>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;border:0.5px solid #E8E0D4;padding:36px 32px;">

              <p style="margin:0 0 8px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#A8A099;letter-spacing:0.1em;text-transform:uppercase;">
                Tu match del día
              </p>

              <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-style:italic;font-size:26px;color:#1E1B17;line-height:1.3;">
                Hola, ${toName}.<br/>
                Hoy te hemos conectado con <span style="color:#C4735A;">${matchName}</span>.
              </h1>

              <p style="margin:0 0 16px;font-size:15px;color:#6B6258;line-height:1.65;font-weight:300;">
                No sabes cómo es todavía — las fotos están bloqueadas.<br/>
                Y eso es a propósito.
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:#6B6258;line-height:1.65;font-weight:300;">
                Esto no va de juzgar en dos segundos.<br/>
                Va de descubrir si hay algo real.
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:#6B6258;line-height:1.65;font-weight:300;">
                Estamos aquí para encontrar a esa persona que puede encajar contigo.<br/>
                Y si no lo es, al menos hay algo básico: educación.
              </p>

              <p style="margin:0 0 32px;font-size:15px;color:#6B6258;line-height:1.65;font-weight:300;">
                Empieza la conversación.<br/>
                <strong style="color:#1E1B17;font-weight:500;">Siete mensajes. Contesta.</strong><br/>
                Y luego vemos qué pasa.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/match"
                       style="display:inline-block;background:#1E1B17;color:#FAF7F2;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;padding:14px 32px;border-radius:12px;">
                      Ver mi match →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#A8A099;line-height:1.6;">
                Too Match · <em>Stop likes. Start match.</em><br/>
                <a href="${appUrl}" style="color:#A8A099;text-decoration:underline;">toomatch.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, toName: string, matchName: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `Hoy te hemos conectado con ${matchName}`,
        html: matchEmail(toName, matchName, APP_URL),
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      const errMsg = `Resend error ${res.status}: ${JSON.stringify(body)}`;
      console.error(`[sendEmail] FAILED to ${to}: ${errMsg}`);
      return { ok: false, error: errMsg };
    }

    console.log(`[sendEmail] OK to ${to} (id: ${body.id})`);
    return { ok: true };
  } catch (err) {
    const errMsg = String(err);
    console.error(`[sendEmail] EXCEPTION to ${to}: ${errMsg}`);
    return { ok: false, error: errMsg };
  }
}

// Fetch all auth users handling pagination
async function getAllAuthUsers() {
  const allUsers: { id: string; email: string }[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error(`[listUsers] Error on page ${page}:`, error);
      break;
    }
    if (!data?.users?.length) break;

    for (const u of data.users) {
      allUsers.push({ id: u.id, email: u.email ?? "" });
    }

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`[listUsers] Total auth users fetched: ${allUsers.length}`);
  return allUsers;
}

Deno.serve(async () => {
  try {
    // Matches pending notification
    const { data: pendingMatches, error: fetchError } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id")
      .is("notified_at", null)
      .is("unmatched_by", null);

    if (fetchError) throw fetchError;
    if (!pendingMatches || pendingMatches.length === 0) {
      console.log("[notify] No pending matches");
      return new Response(JSON.stringify({ sent: 0, message: "No pending matches" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[notify] Found ${pendingMatches.length} pending match(es)`);

    const userIds = [...new Set(pendingMatches.flatMap((m) => [m.user1_id, m.user2_id]))];
    console.log(`[notify] User IDs involved: ${userIds.join(", ")}`);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const authUsers = await getAllAuthUsers();

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));
    const emailMap = Object.fromEntries(authUsers.map((u) => [u.id, u.email]));

    // Log what we found
    for (const uid of userIds) {
      console.log(`[notify] uid=${uid} profile=${profileMap[uid]?.display_name ?? "NOT FOUND"} email=${emailMap[uid] || "NOT FOUND"}`);
    }

    let sent = 0;
    const results: { matchId: string; email1: string; email2: string; sent1: boolean; sent2: boolean }[] = [];
    const notifiedIds: string[] = [];

    for (const match of pendingMatches) {
      const p1 = profileMap[match.user1_id];
      const p2 = profileMap[match.user2_id];
      const email1 = emailMap[match.user1_id];
      const email2 = emailMap[match.user2_id];

      if (!p1 || !p2) {
        console.error(`[notify] Missing profile for match ${match.id}: p1=${!!p1} p2=${!!p2}`);
        notifiedIds.push(match.id); // mark as notified to avoid retrying broken data
        continue;
      }
      if (!email1 || !email2) {
        console.error(`[notify] Missing email for match ${match.id}: email1=${email1 || "MISSING"} email2=${email2 || "MISSING"}`);
        notifiedIds.push(match.id);
        continue;
      }

      const name1 = p1.display_name?.split(" ")[0] ?? "tú";
      const name2 = p2.display_name?.split(" ")[0] ?? "alguien especial";

      const r1 = await sendEmail(email1, name1, name2);
      const r2 = await sendEmail(email2, name2, name1);

      if (r1.ok) sent++;
      if (r2.ok) sent++;

      results.push({ matchId: match.id, email1, email2, sent1: r1.ok, sent2: r2.ok });
      notifiedIds.push(match.id);
    }

    // Mark all processed matches as notified (even partial failures — to avoid retrying)
    if (notifiedIds.length > 0) {
      await supabase
        .from("matches")
        .update({ notified_at: new Date().toISOString() })
        .in("id", notifiedIds);
    }

    console.log(`[notify] Done. sent=${sent} matches=${notifiedIds.length}`);

    return new Response(JSON.stringify({ sent, matches: notifiedIds.length, results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[notify] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
