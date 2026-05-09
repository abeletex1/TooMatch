// ============================================================================
// Tipos de dominio — Too Match
// ============================================================================

export type ProfileRow = {
  user_id: string;
  display_name: string | null;
  self_description: string | null;
  partner_description: string | null;
  values: string[];
  gender: "male" | "female" | "other" | null;
  seeking: "male" | "female" | "both" | null;
  age: number | null;
  age_min: number;
  age_max: number;
  distance_km: number;
  province: string | null;
  city: string | null;
  photos: string[];
  onboarding_completed: boolean;
  day_number: number;
  relationship_intent: string | null;
};

export type MatchRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  unmatched_by: string | null;
  unmatch_reason: string | null;
  created_at: string;
  viewed_at: string | null;
};

/** Match completo con perfil del partner ya calculado */
export type RealMatch = {
  id: string;                                  // match record UUID
  partnerId: string;                           // user_id del partner
  initial: string;                             // primera letra del nombre
  name: string;                                // display_name del partner
  age: number;                                 // edad del partner
  city: string;                                // ciudad del partner
  short: string;                               // línea corta para el hero
  self_description: string;
  partner_description: string;
  values: string[];                            // valores del partner
  compatibility: number;                       // 0-100
  breakdown: { label: string; pct: number }[]; // desglose para la card
  sharedTags: string[];                        // valores en común
  photos: string[];                            // fotos del partner
  gender: "male" | "female" | "other" | null; // género del partner
  messageCount: number;                        // mensajes intercambiados
  isNew: boolean;                              // true si el usuario no lo ha visto aún
};

export type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type DailyQuestionRow = {
  id: string;
  question_text: string;
  options: string[];
  active_date: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function profileToDisplayName(profile: Pick<ProfileRow, "display_name">): string {
  return profile.display_name?.trim() || "Perfil";
}

export function genderLabel(gender: string | null): string {
  if (gender === "male") return "Hombre";
  if (gender === "female") return "Mujer";
  if (gender === "other") return "Otro";
  return "No indicado";
}

export function seekingLabel(seeking: string | null): string {
  if (seeking === "male") return "Hombres";
  if (seeking === "female") return "Mujeres";
  if (seeking === "both") return "Todos";
  return "No indicado";
}

// ─── Compatibilidad ─────────────────────────────────────────────────────────
//
// FILTROS OBLIGATORIOS (resueltos en find_compatible_profiles RPC):
//   - género buscado coincide
//   - distancia dentro del rango
//
// SCORE (solo si pasan los filtros):
//   - Valores            40 %  — Jaccard sobre los valores declarados
//   - Afinidad personal  40 %  — intención de relación (60 %) + cercanía de edad (40 %)
//   - Preguntas del día  20 %  — % de respuestas iguales en preguntas que ambos contestaron

/** Componentes internos — una sola fuente de verdad para score y breakdown */
function scoreComponents(
  p1: ProfileRow,
  p2: ProfileRow,
  answers1: Record<string, string> = {},
  answers2: Record<string, string> = {}
) {
  // — Valores: Jaccard similarity —
  const shared = p1.values.filter((v) => p2.values.includes(v)).length;
  const union = new Set([...p1.values, ...p2.values]).size;
  const valores = union > 0 ? Math.round((shared / union) * 100) : 50;

  // — Afinidad personal: intención (60%) + edad (40%) —
  const i1 = p1.relationship_intent;
  const i2 = p2.relationship_intent;
  let intentScore = 70;
  if (i1 && i2) {
    if (i1 === i2) {
      intentScore = 97;
    } else {
      const compatible: Record<string, string[]> = {
        "Una relación seria": ["Conocer gente y ver qué pasa"],
        "Conocer gente y ver qué pasa": ["Una relación seria", "Amistad", "Algo casual, sin compromiso"],
        "Amistad": ["Conocer gente y ver qué pasa"],
        "Algo casual, sin compromiso": ["Conocer gente y ver qué pasa"],
      };
      intentScore = compatible[i1]?.includes(i2) ? 72 : 40;
    }
  }
  const ageDiff = p1.age && p2.age ? Math.abs(p1.age - p2.age) : 8;
  const ageScore = Math.round(Math.max(55, 100 - ageDiff * 2));
  const afinidad = Math.round(intentScore * 0.6 + ageScore * 0.4);

  // — Preguntas del día: % de respuestas coincidentes —
  const commonIds = Object.keys(answers1).filter((id) => answers2[id] !== undefined);
  let preguntas = 50; // neutral si no hay datos
  if (commonIds.length > 0) {
    const matches = commonIds.filter((id) => answers1[id] === answers2[id]).length;
    preguntas = Math.round((matches / commonIds.length) * 100);
  }

  return { valores, afinidad, preguntas };
}

/** Score 0-100 para el algoritmo de matching (y para el headline del match card) */
export function computeCompatibility(
  p1: ProfileRow,
  p2: ProfileRow,
  answers1: Record<string, string> = {},
  answers2: Record<string, string> = {}
): number {
  const { valores, afinidad, preguntas } = scoreComponents(p1, p2, answers1, answers2);
  return Math.round(valores * 0.4 + afinidad * 0.4 + preguntas * 0.2);
}

/** Desglose visual — mismos componentes, mismos pesos */
export function computeBreakdown(
  myProfile: ProfileRow,
  partnerProfile: ProfileRow,
  myAnswers: Record<string, string> = {},
  partnerAnswers: Record<string, string> = {}
): { label: string; pct: number }[] {
  const { valores, afinidad, preguntas } = scoreComponents(myProfile, partnerProfile, myAnswers, partnerAnswers);
  return [
    { label: "Valores", pct: valores },
    { label: "Afinidad", pct: afinidad },
    { label: "Preguntas", pct: preguntas },
  ];
}

/** Construye un RealMatch a partir de las filas de DB */
export function buildRealMatch(
  matchRow: MatchRow,
  myProfile: ProfileRow,
  partnerProfile: ProfileRow,
  messageCount: number,
  myAnswers: Record<string, string> = {},
  partnerAnswers: Record<string, string> = {}
): RealMatch {
  const name = profileToDisplayName(partnerProfile);
  const shared = myProfile.values.filter((v) =>
    partnerProfile.values.includes(v)
  );

  const age = partnerProfile.age ?? 0;
  const city = partnerProfile.city ?? "";
  const parts = [
    age ? `${age}` : null,
    city || null,
  ].filter(Boolean);

  return {
    id: matchRow.id,
    partnerId: partnerProfile.user_id,
    initial: name.charAt(0).toUpperCase(),
    name,
    age,
    city,
    short: parts.join(" · "),
    self_description: partnerProfile.self_description ?? "",
    partner_description: partnerProfile.partner_description ?? "",
    values: partnerProfile.values,
    compatibility: computeCompatibility(myProfile, partnerProfile, myAnswers, partnerAnswers),
    breakdown: computeBreakdown(myProfile, partnerProfile, myAnswers, partnerAnswers),
    sharedTags: shared,
    photos: partnerProfile.photos,
    gender: partnerProfile.gender,
    messageCount,
    isNew: !(matchRow as MatchRow).viewed_at,
  };
}
