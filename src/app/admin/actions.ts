"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { sendPushToUsers } from "@/lib/push";

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

  await sendPushToUsers([user1Id, user2Id], {
    title: "✦ Tienes un nuevo match",
    body: "Alguien compatible contigo está esperando. Entra para descubrirlo.",
    url: "/match",
    type: "match",
  });

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

const VALUES_LABELS: Record<string, string> = {
  valuesHonesty: "Honestidad", valuesHumor: "Humor", valuesCuriosity: "Curiosidad",
  valuesEmpathy: "Empatía", valuesLoyalty: "Lealtad", valuesAmbition: "Ambición",
  valuesCalm: "Calma", valuesCreativity: "Creatividad", valuesIndependence: "Independencia",
  valuesGenerosity: "Generosidad", valuesAdventure: "Aventura", valuesNature: "Naturaleza",
  valuesSport: "Deporte", valuesTravel: "Viajes", valuesNightlife: "Vida nocturna",
  valuesQuiet: "Vida tranquila", valuesFamily: "Familia", valuesPets: "Mascotas",
  valuesFood: "Gastronomía", valuesProgressive: "Progresista", valuesConservative: "Conservador",
  valuesIndividualFreedom: "Libertad individual", valuesSocialJustice: "Justicia social",
  valuesFeminism: "Feminismo", valuesSpirituality: "Espiritualidad",
  valuesScience: "Ciencia y razón", valuesTradition: "Tradición", valuesSustainability: "Sostenibilidad",
};

export async function aiMatchAction(): Promise<{ matched: number; pairs: string[][]; error?: string }> {
  await assertAdmin();
  const admin = getServiceClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, display_name, gender, seeking, age, age_min, age_max, values, self_description, partner_description")
    .eq("onboarding_completed", true);

  if (profilesError) return { matched: 0, pairs: [], error: profilesError.message };
  if (!profiles || profiles.length < 2) return { matched: 0, pairs: [], error: "Se necesitan al menos 2 usuarios." };

  // Matches ya existentes para evitar repetir parejas
  const { data: activeMatches } = await admin
    .from("matches")
    .select("user1_id, user2_id")
    .is("unmatched_by", null);

  const existingPairSet = new Set(
    (activeMatches ?? []).map((m) => [m.user1_id, m.user2_id].sort().join(":"))
  );
  const matchCount = new Map<string, number>();
  for (const m of activeMatches ?? []) {
    matchCount.set(m.user1_id, (matchCount.get(m.user1_id) ?? 0) + 1);
    matchCount.set(m.user2_id, (matchCount.get(m.user2_id) ?? 0) + 1);
  }

  function translateValues(keys: string[]): string {
    return keys.map((k) => VALUES_LABELS[k] ?? k).join(", ") || "—";
  }

  const profileText = profiles.map((p, i) => `Perfil ${i + 1}:
- ID: ${p.user_id}
- Nombre: ${p.display_name ?? "Sin nombre"}
- Género: ${p.gender ?? "—"}
- Busca: ${p.seeking ?? "—"}, rango de edad ${p.age_min ?? 18}-${p.age_max ?? 99}
- Edad: ${p.age ?? "—"}
- Matches actuales: ${matchCount.get(p.user_id) ?? 0}
- Valores: ${translateValues(p.values ?? [])}
- Sobre mí: "${p.self_description ?? "—"}"
- Qué busco: "${p.partner_description ?? "—"}"`).join("\n\n");

  const existingPairsText = existingPairSet.size > 0
    ? `\nPAREJAS YA EXISTENTES (no repetir):\n${[...existingPairSet].map((p) => `- ${p.replace(":", " y ")}`).join("\n")}`
    : "";

  const systemPrompt = `Eres el sistema de matching de Too Match, una app de citas con personalidad. Tu tarea es crear parejas compatibles entre los usuarios dados.

REGLAS ESTRICTAS (en orden de prioridad):
1. Respeta orientación sexual: si busca "female" solo emparéjalo con género "female"; "male" con "male"; "both" con cualquiera. Esta regla es ABSOLUTA.
2. Respeta rangos de edad mutuamente (preferencia): la edad de A debe estar en el rango de B y viceversa. Si es IMPOSIBLE cumplirla para alguien, puedes ampliar el rango como ÚLTIMO RECURSO para no dejar a nadie sin match.
3. No repitas parejas que ya existen (ver lista al final).
4. Nadie puede quedar sin pareja. Si hay número impar, alguien recibe 2 matches — elige quién con la regla de equidad.
5. EQUIDAD DE MATCHES: Dentro de cada grupo (mismo género + misma orientación sexual), entre los que ya tienen más de 1 match, la diferencia entre el que más tiene y el que menos no puede superar 1. Si alguien llegaría a tener 2 más que el mínimo del grupo, dale ese match a otra persona del grupo primero.

CÁLCULO DE COMPATIBILIDAD (para decidir las mejores parejas):
- 40% — Valores compartidos: cuántos valores tiene en común la pareja.
- 40% — Compatibilidad de texto BIDIRECCIONAL: evalúa si lo que A busca en una persona ("Qué busco") encaja con cómo se describe B ("Sobre mí"), Y si lo que B busca encaja con cómo se describe A. Ambas direcciones deben funcionar.
- 20% — Preguntas diarias: si están disponibles en los datos, úsalas. Si no hay datos, ignora este criterio y redistribuye el peso entre los otros dos.

Con estos criterios, elige las parejas que maximicen la compatibilidad global.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{"pairs": [["uuid1", "uuid2"], ["uuid3", "uuid4"]]}${existingPairsText}`;

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
      && !existingPairSet.has([a, b].sort().join(":"))
  );

  if (validPairs.length === 0) return { matched: 0, pairs: [], error: "La IA no generó parejas válidas." };

  const { error } = await admin.from("matches").insert(
    validPairs.map(([user1_id, user2_id]) => ({ user1_id, user2_id }))
  );
  if (error) return { matched: 0, pairs: [], error: error.message };

  const allUserIds = [...new Set(validPairs.flat())];
  await sendPushToUsers(allUserIds, {
    title: "✦ Tienes un nuevo match",
    body: "Alguien compatible contigo está esperando. Entra para descubrirlo.",
    url: "/match",
    type: "match",
  });

  return { matched: validPairs.length, pairs: validPairs };
}

export async function autoMatchAction(): Promise<{ matched: number; skipped: number; error?: string }> {
  await assertAdmin();
  const admin = getServiceClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, display_name, gender, seeking, age, age_min, age_max, values, event_tag, self_description, partner_description")
    .eq("onboarding_completed", true);

  if (profilesError) return { matched: 0, skipped: 0, error: profilesError.message };
  if (!profiles || profiles.length < 2) return { matched: 0, skipped: profiles?.length ?? 0 };

  // Non-null assertion para que TypeScript no se queje dentro de closures
  const allProfiles = profiles as NonNullable<typeof profiles>;
  type Profile = (typeof allProfiles)[number];

  const { data: activeMatches } = await admin
    .from("matches")
    .select("user1_id, user2_id")
    .is("unmatched_by", null);

  // Contadores de matches por usuario (existentes + nuevos en esta ejecución)
  const matchCount = new Map<string, number>();
  const existingPairs = new Set<string>();
  for (const m of activeMatches ?? []) {
    matchCount.set(m.user1_id, (matchCount.get(m.user1_id) ?? 0) + 1);
    matchCount.set(m.user2_id, (matchCount.get(m.user2_id) ?? 0) + 1);
    existingPairs.add([m.user1_id, m.user2_id].sort().join(":"));
  }

  const runPairs = new Set<string>();
  const newMatches: { user1_id: string; user2_id: string; compatibility_score: number }[] = [];

  function pk(a: string, b: string) { return [a, b].sort().join(":"); }
  function getCount(id: string) { return matchCount.get(id) ?? 0; }
  function addCount(id: string) { matchCount.set(id, getCount(id) + 1); }

  function groupKey(p: Profile) { return `${p.gender ?? "?"}:${p.seeking ?? "?"}`; }

  // Equidad: entre los que ya tienen >1 match en el mismo grupo, la diferencia max-min no puede ser >1
  function isFairCandidate(candidateId: string): boolean {
    const candidate = allProfiles.find((p) => p.user_id === candidateId);
    if (!candidate) return false;
    const countAfter = getCount(candidateId) + 1;
    if (countAfter <= 1) return true;

    const group = groupKey(candidate);
    const peersAbove1 = allProfiles
      .filter((p) => p.user_id !== candidateId && groupKey(p) === group)
      .map((p) => getCount(p.user_id))
      .filter((c) => c > 1);

    if (peersAbove1.length === 0) return true;
    return countAfter <= Math.min(...peersAbove1) + 1;
  }

  function genderOk(a: Profile, b: Profile) {
    // Usuarios con event_tag solo se emparejan entre sí (mismo tag o ambos sin tag)
    if ((a.event_tag ?? null) !== (b.event_tag ?? null)) return false;
    return (a.seeking === "both" || a.seeking === b.gender) &&
           (b.seeking === "both" || b.seeking === a.gender);
  }

  function ageOk(a: Profile, b: Profile) {
    if (!a.age || !b.age) return true;
    return a.age >= (b.age_min ?? 18) && a.age <= (b.age_max ?? 99) &&
           b.age >= (a.age_min ?? 18) && b.age <= (a.age_max ?? 99);
  }

  function tokenize(text: string): Set<string> {
    const STOP = new Set(["de","la","el","en","un","una","y","a","que","es","lo","con","por","para","su","se","me","te","nos","les","al","del","mi","tu","sus","mis","tus","muy","más","pero","si","no","ya","también","esto","eso","así","hay","bien","todo","cada","cuando","porque","cómo","qué","quién","como","que","ser","estar","tener","hacer"]);
    return new Set(
      text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi, " ").split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w))
    );
  }

  function textSimilarity(seeking: string | null, selfDesc: string | null): number {
    if (!seeking || !selfDesc) return 50;
    const seekWords = tokenize(seeking);
    const selfWords = tokenize(selfDesc);
    if (seekWords.size === 0 || selfWords.size === 0) return 50;
    const matches = [...seekWords].filter((w) => selfWords.has(w)).length;
    return Math.min(100, Math.round((matches / Math.min(seekWords.size, selfWords.size)) * 100));
  }

  function compatScore(a: Profile, b: Profile): number {
    // 40% valores compartidos
    const av: string[] = a.values ?? [], bv: string[] = b.values ?? [];
    const shared = av.filter((v) => bv.includes(v)).length;
    const union = new Set([...av, ...bv]).size;
    const valuesScore = union > 0 ? (shared / union) * 100 : 50;

    // 40% texto bidireccional: lo que A busca vs cómo se describe B, y viceversa
    const textAB = textSimilarity(a.partner_description, b.self_description);
    const textBA = textSimilarity(b.partner_description, a.self_description);
    const textScore = (textAB + textBA) / 2;

    // 20% preguntas diarias — sin datos aún, peso redistribuido (50/50 temporal)
    // Cuando existan: cargar respuestas de daily_answers y calcular aquí

    return Math.round(valuesScore * 0.5 + textScore * 0.5);
  }

  function alreadyPaired(a: string, b: string) {
    const key = pk(a, b);
    return existingPairs.has(key) || runPairs.has(key);
  }

  function doMatch(a: Profile, b: Profile) {
    newMatches.push({ user1_id: a.user_id, user2_id: b.user_id, compatibility_score: compatScore(a, b) });
    runPairs.add(pk(a.user_id, b.user_id));
    addCount(a.user_id);
    addCount(b.user_id);
  }

  // Candidatos válidos para un perfil. strictAge controla si se respeta el rango de edad.
  // fairOnly: si true, solo candidatos que cumplen la regla de equidad.
  function getCandidates(
    profile: Profile,
    { strictAge, fairOnly }: { strictAge: boolean; fairOnly: boolean }
  ) {
    return allProfiles
      .filter((c) => {
        if (c.user_id === profile.user_id) return false;
        if (!genderOk(profile, c)) return false;
        if (alreadyPaired(profile.user_id, c.user_id)) return false;
        if (strictAge && !ageOk(profile, c)) return false;
        if (fairOnly && !isFairCandidate(c.user_id)) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = getCount(a.user_id) - getCount(b.user_id);
        if (diff !== 0) return diff;
        return compatScore(profile, b) - compatScore(profile, a);
      });
  }

  // Procesar primero a quien tiene menos opciones disponibles (más difícil de emparejar)
  const unmatched = allProfiles.filter((p) => getCount(p.user_id) === 0);
  const sortedByDifficulty = [...unmatched].sort((a, b) => {
    const aC = allProfiles.filter((c) => c.user_id !== a.user_id && genderOk(a, c) && ageOk(a, c)).length;
    const bC = allProfiles.filter((c) => c.user_id !== b.user_id && genderOk(b, c) && ageOk(b, c)).length;
    return aC - bC;
  });

  // Fase 1: edad estricta + equidad
  for (const profile of sortedByDifficulty) {
    if (getCount(profile.user_id) > 0) continue;
    const best = getCandidates(profile, { strictAge: true, fairOnly: true })[0];
    if (best) doMatch(profile, best);
  }

  // Fase 2: edad relajada + equidad (último recurso de edad)
  for (const profile of sortedByDifficulty) {
    if (getCount(profile.user_id) > 0) continue;
    const best = getCandidates(profile, { strictAge: false, fairOnly: true })[0];
    if (best) doMatch(profile, best);
  }

  // Fase 3: número impar — dar 2º match a alguien ya emparejado (respetando equidad)
  for (const profile of sortedByDifficulty) {
    if (getCount(profile.user_id) > 0) continue;
    const best = getCandidates(profile, { strictAge: false, fairOnly: false })[0];
    if (best) doMatch(profile, best);
  }

  const skipped = sortedByDifficulty.filter((p) => getCount(p.user_id) === 0).length;

  if (newMatches.length === 0) return { matched: 0, skipped };

  const { error } = await admin.from("matches").insert(newMatches);
  if (error) return { matched: 0, skipped, error: error.message };

  const allUserIds = [...new Set(newMatches.flatMap((m) => [m.user1_id, m.user2_id]))];
  await sendPushToUsers(allUserIds, {
    title: "✦ Tienes un nuevo match",
    body: "Alguien compatible contigo está esperando. Entra para descubrirlo.",
    url: "/match",
    type: "match",
  });

  return { matched: newMatches.length, skipped };
}
