"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/match");
  return user;
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createMatchAction(
  user1Id: string,
  user2Id: string
): Promise<{ error?: string }> {
  await assertAdmin();

  const admin = getServiceClient();

  // Comprobar que no existe ya un match entre estos dos (activo o pasado)
  const { data: existing } = await admin
    .from("matches")
    .select("id")
    .or(
      `and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`
    )
    .is("unmatched_by", null)
    .maybeSingle();

  if (existing) return { error: "Ya existe un match activo entre estas dos personas." };

  const { error } = await admin.from("matches").insert({
    user1_id: user1Id,
    user2_id: user2Id,
  });

  if (error) return { error: error.message };
  return {};
}

export async function deleteMatchAction(
  matchId: string
): Promise<{ error?: string }> {
  await assertAdmin();

  const admin = getServiceClient();

  const { error } = await admin
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (error) return { error: error.message };
  return {};
}

export async function aiMatchAction(): Promise<{ matched: number; pairs: string[][]; error?: string }> {
  await assertAdmin();
  const admin = getServiceClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, display_name, gender, seeking, age, age_min, age_max, values, self_description, partner_description")
    .eq("onboarding_completed", true);

  if (profilesError) return { matched: 0, pairs: [], error: profilesError.message };
  if (!profiles || profiles.length < 2) return { matched: 0, pairs: [], error: "Se necesitan al menos 2 usuarios." };

  const profileText = profiles.map((p, i) => `Perfil ${i + 1}:
- ID: ${p.user_id}
- Nombre: ${p.display_name ?? "Sin nombre"}
- Género: ${p.gender ?? "—"}
- Busca: ${p.seeking ?? "—"}, rango de edad ${p.age_min ?? 18}-${p.age_max ?? 99}
- Edad: ${p.age ?? "—"}
- Valores: ${(p.values ?? []).join(", ") || "—"}
- Sobre mí: "${p.self_description ?? "—"}"
- Qué busco: "${p.partner_description ?? "—"}"`).join("\n\n");

  const systemPrompt = `Eres el sistema de matching de Too Match, una app de citas con personalidad. Tu tarea es crear parejas entre los usuarios dados.

REGLAS ESTRICTAS:
1. Nadie puede quedar sin pareja. Si hay número impar, alguien recibe 2 matches.
2. Un usuario puede tener varios matches — no hay límite.
3. Respeta orientación sexual: si busca "female" solo emparéjalo con género "female". Si busca "male" solo con "male". Si busca "both", con cualquiera.
4. Respeta rangos de edad mutuamente: la edad de A debe estar en el rango de B, y la de B en el rango de A.
5. Maximiza compatibilidad: valores en común, descripciones complementarias.
6. Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{"pairs": [["uuid1", "uuid2"], ["uuid3", "uuid4"]]}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: profileText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { matched: 0, pairs: [], error: `OpenAI error ${res.status}: ${err}` };
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  let pairs: string[][];
  try {
    const parsed = JSON.parse(content);
    pairs = parsed.pairs;
    if (!Array.isArray(pairs)) throw new Error("pairs no es array");
  } catch {
    return { matched: 0, pairs: [], error: `Respuesta IA inválida: ${content.slice(0, 200)}` };
  }

  const profileIds = new Set(profiles.map((p) => p.user_id));
  const validPairs = pairs.filter(
    ([a, b]) => a && b && profileIds.has(a) && profileIds.has(b) && a !== b
  );

  if (validPairs.length === 0) return { matched: 0, pairs: [], error: "La IA no generó parejas válidas." };

  const { error } = await admin.from("matches").insert(
    validPairs.map(([user1_id, user2_id]) => ({ user1_id, user2_id }))
  );
  if (error) return { matched: 0, pairs: [], error: error.message };

  return { matched: validPairs.length, pairs: validPairs };
}

export async function autoMatchAction(): Promise<{ matched: number; skipped: number; error?: string }> {
  await assertAdmin();
  const admin = getServiceClient();

  // Todos los perfiles con onboarding completado
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, display_name, gender, seeking, age, age_min, age_max, values")
    .eq("onboarding_completed", true);

  if (profilesError) return { matched: 0, skipped: 0, error: profilesError.message };

  // Usuarios ya emparejados (match activo)
  const { data: activeMatches } = await admin
    .from("matches")
    .select("user1_id, user2_id")
    .is("unmatched_by", null);

  const matchedIds = new Set(
    (activeMatches ?? []).flatMap((m) => [m.user1_id, m.user2_id])
  );

  // Usuarios sin match activo
  const unmatched = (profiles ?? []).filter((p) => !matchedIds.has(p.user_id));

  const paired = new Set<string>();
  const newMatches: { user1_id: string; user2_id: string; compatibility_score: number }[] = [];

  for (const profile of unmatched) {
    if (paired.has(profile.user_id)) continue;

    // Candidatos compatibles según RPC (filtra género/edad/ya emparejados)
    const { data: candidates } = await admin.rpc("find_compatible_profiles", {
      for_user_id: profile.user_id,
    });

    const available = (candidates ?? []).filter(
      (c: { user_id: string }) => !paired.has(c.user_id) && !matchedIds.has(c.user_id)
    );

    if (available.length === 0) continue;

    // Calcular compatibilidad y elegir el mejor candidato
    const myValues: string[] = profile.values ?? [];
    const best = available
      .map((c: { user_id: string; user_values: string[] }) => {
        const shared = (c.user_values ?? []).filter((v: string) => myValues.includes(v)).length;
        const union = new Set([...myValues, ...(c.user_values ?? [])]).size;
        const valueScore = union > 0 ? Math.round((shared / union) * 100) : 50;
        const ageDiff = profile.age && (c as { age?: number }).age
          ? Math.abs(profile.age - ((c as { age?: number }).age ?? 0))
          : 10;
        const ageScore = Math.max(0, 100 - ageDiff * 3);
        const score = Math.round(valueScore * 0.65 + ageScore * 0.35);
        return { ...c, score };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)[0];

    newMatches.push({
      user1_id: profile.user_id,
      user2_id: best.user_id,
      compatibility_score: best.score,
    });
    paired.add(profile.user_id);
    paired.add(best.user_id);
  }

  const skipped = unmatched.length - paired.size;

  if (newMatches.length === 0) return { matched: 0, skipped };

  const { error } = await admin.from("matches").insert(newMatches);
  if (error) return { matched: 0, skipped, error: error.message };

  return { matched: newMatches.length, skipped };
}
