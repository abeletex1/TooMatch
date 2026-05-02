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

/**
 * Devuelve el match activo del usuario para hoy.
 * Si no existe ninguno, intenta crear uno nuevo buscando el candidato más
 * compatible. Devuelve null si no hay candidatos o si ya usó su match hoy.
 */
export async function getOrCreateTodaysMatch(
  userId: string
): Promise<RealMatch | null> {
  const supabase = await createClient();

  // 1. ¿Hay un match activo (no deshecho)?
  const { data: activeMatch } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .is("unmatched_by", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeMatch) {
    return resolveMatch(activeMatch as MatchRow, userId, supabase);
  }

  // 2. ¿Ya deshizo un match hoy? Si es así, no asignamos otro hasta mañana.
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

  if (todaysUnmatch) return null;

  // 3. Buscar candidatos compatibles vía RPC (SECURITY DEFINER)
  const { data: candidates } = await supabase.rpc(
    "find_compatible_profiles",
    { for_user_id: userId }
  );

  if (!candidates || candidates.length === 0) return null;

  // 4. Obtener mi propio perfil para calcular compatibilidad
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!myProfile) return null;

  // 5. Ordenar por score y tomar el mejor
  // La RPC devuelve "user_values" (evitar conflicto con keyword SQL "values")
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

  if (error || !newMatch) return null;

  // 7. Incrementar day_number de ambos usuarios
  await admin
    .from("profiles")
    .update({ day_number: (myProfile.day_number ?? 0) + 1 })
    .eq("user_id", userId);
  await admin
    .from("profiles")
    .update({ day_number: (best.profile.day_number ?? 0) + 1 })
    .eq("user_id", best.profile.user_id);

  const messageCount = 0;
  return buildRealMatch(
    newMatch as MatchRow,
    myProfile as ProfileRow,
    best.profile,
    messageCount
  );
}

/** Resuelve un match existente: obtiene el perfil del partner y el conteo de mensajes */
async function resolveMatch(
  matchRow: MatchRow,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<RealMatch | null> {
  const partnerId =
    matchRow.user1_id === userId ? matchRow.user2_id : matchRow.user1_id;

  const [{ data: partnerProfile }, { data: myProfile }, { count }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", partnerId).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", matchRow.id),
    ]);

  if (!partnerProfile || !myProfile) return null;

  return buildRealMatch(
    matchRow,
    myProfile as ProfileRow,
    partnerProfile as ProfileRow,
    count ?? 0
  );
}
