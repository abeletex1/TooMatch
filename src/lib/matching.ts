"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRealMatch,
  computeCompatibility,
  type MatchRow,
  type ProfileRow,
  type RealMatch,
} from "@/lib/types";
import { sendPushToUsers } from "@/lib/push";

/**
 * Devuelve todos los matches activos del usuario (no deshechos).
 * Si no hay ninguno, intenta crear uno nuevo.
 */
export async function getAllActiveMatches(
  userId: string
): Promise<RealMatch[]> {
  const supabase = await createClient();

  // 1. Todos los matches activos (sin limite)
  const { data: activeMatches } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .is("unmatched_by", null)
    .order("created_at", { ascending: true });

  if (activeMatches && activeMatches.length > 0) {
    const resolved = await Promise.all(
      (activeMatches as MatchRow[]).map((m) => resolveMatch(m, userId, supabase))
    );
    return resolved.filter((m): m is RealMatch => m !== null);
  }

  // 2. ¿Ya deshizo un match hoy? No asignamos otro hasta mañana.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaysUnmatch } = await supabase
    .from("matches")
    .select("id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .not("unmatched_by", "is", null)
    .gte("created_at", todayStart.toISOString())
    .limit(1)
    .maybeSingle();

  if (todaysUnmatch) return [];

  // 3. Buscar candidatos compatibles vía RPC (SECURITY DEFINER)
  const { data: candidates } = await supabase.rpc(
    "find_compatible_profiles",
    { for_user_id: userId }
  );

  if (!candidates || candidates.length === 0) return [];

  // 4. Mi perfil
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!myProfile) return [];

  // 5. Normalizar: la RPC devuelve "user_values" para evitar conflicto con keyword SQL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = (candidates as any[]).map((c) => ({
    ...c,
    values: c.user_values ?? [],
  })) as ProfileRow[];

  const scored = normalized
    .map((c) => ({
      profile: c,
      score: computeCompatibility(myProfile as ProfileRow, c),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  // 6. Crear el match (admin client para bypass RLS en el INSERT)
  const admin = createAdminClient();
  const { data: newMatch, error } = await admin
    .from("matches")
    .insert({
      user1_id: userId,
      user2_id: best.profile.user_id,
      compatibility_score: best.score,
    })
    .select()
    .single();

  if (error || !newMatch) return [];

  // 7. Incrementar day_number de ambos usuarios
  await admin
    .from("profiles")
    .update({ day_number: (myProfile.day_number ?? 0) + 1 })
    .eq("user_id", userId);
  await admin
    .from("profiles")
    .update({ day_number: (best.profile.day_number ?? 0) + 1 })
    .eq("user_id", best.profile.user_id);

  const realMatch = buildRealMatch(
    newMatch as MatchRow,
    myProfile as ProfileRow,
    best.profile,
    0
  );

  // Notificar a ambos usuarios
  sendPushToUsers([userId, best.profile.user_id], {
    title: "✦ Tienes un nuevo match",
    body: "Alguien compatible con ti está esperando. Empieza la conversación.",
    url: "/match",
  });

  return [realMatch];
}

/** @deprecated Use getAllActiveMatches instead */
export async function getOrCreateTodaysMatch(
  userId: string
): Promise<RealMatch | null> {
  const matches = await getAllActiveMatches(userId);
  return matches[0] ?? null;
}

/** Resuelve un match existente: obtiene el perfil del partner, mensajes y respuestas diarias */
async function resolveMatch(
  matchRow: MatchRow,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<RealMatch | null> {
  const partnerId =
    matchRow.user1_id === userId ? matchRow.user2_id : matchRow.user1_id;

  const admin = createAdminClient();

  const [
    { data: partnerProfile },
    { data: myProfile },
    { count },
    { data: myAnswersRaw },
    { data: partnerAnswersRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", partnerId).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchRow.id),
    admin.from("daily_answers").select("question_id, answer").eq("user_id", userId),
    admin.from("daily_answers").select("question_id, answer").eq("user_id", partnerId),
  ]);

  if (!partnerProfile || !myProfile) return null;

  // Convertir a Record<questionId, answer>
  const toMap = (rows: { question_id: string; answer: string }[] | null) =>
    Object.fromEntries((rows ?? []).map((r) => [r.question_id, r.answer]));

  return buildRealMatch(
    matchRow,
    myProfile as ProfileRow,
    partnerProfile as ProfileRow,
    count ?? 0,
    toMap(myAnswersRaw),
    toMap(partnerAnswersRaw)
  );
}
