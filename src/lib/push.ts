"use server";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMatchEmail, sendMessageEmail } from "@/lib/email";

webpush.setVapidDetails(
  "mailto:hola@toomatch.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: "match" | "message";
  senderName?: string;
  matchId?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  // Sin suscripción push → fallback a email
  if (!subs || subs.length === 0) {
    if (payload.type === "match") {
      sendMatchEmail(userId);
    } else if (payload.type === "message" && payload.senderName && payload.matchId) {
      sendMessageEmail(userId, payload.senderName, payload.body, payload.matchId);
    }
    return;
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      })
    )
  );

  return results;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}
