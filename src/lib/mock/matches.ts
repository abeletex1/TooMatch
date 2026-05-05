/**
 * Datos mock de matches mientras no hay matching real.
 * Cuando montemos las tablas matches/messages, este archivo desaparece.
 */

export type MockMatch = {
  id: string;
  initial: string;
  name: string;
  age: number;
  city: string;
  short: string; // traits cortos para el hero
  self_description: string;
  partner_description: string;
  values: string[];
  compatibility: number;
  breakdown: { label: string; pct: number }[];
  sharedTags: string[];
  photos: string[];
  initialMessages: { from: "me" | "them"; text: string }[];
};

export const LUCIA: MockMatch = {
  id: "lucia",
  initial: "L",
  name: "Lucía",
  age: 27,
  city: "Madrid",
  short: "27 · Madrid · Curiosa",
  self_description:
    "Soy curiosa por naturaleza. Me dedico al diseño editorial y los fines de semana suelo perderme en exposiciones o caminando por barrios que no conozco. Me cuesta el ruido pero adoro las conversaciones largas.",
  partner_description:
    "Alguien con curiosidad real, que me cuente cosas que no sé y sepa escuchar. Que tenga su mundo propio. No busco prisa.",
  values: ["Curiosidad", "Humor", "Honestidad", "Naturaleza"],
  compatibility: 87,
  breakdown: [
    { label: "Valores", pct: 92 },
    { label: "Personalidad", pct: 85 },
    { label: "Lo que buscas", pct: 84 },
  ],
  sharedTags: ["Curiosidad", "Humor", "Naturaleza"],
  photos: [
    "https://picsum.photos/seed/lucia-1/400/400",
    "https://picsum.photos/seed/lucia-2/400/400",
    "https://picsum.photos/seed/lucia-3/400/400",
    "https://picsum.photos/seed/lucia-4/400/400",
  ],
  initialMessages: [
    { from: "them", text: "Hola, ¿qué tal tu día?" },
    { from: "me", text: "Bien, hoy he terminado un proyecto que llevaba semanas." },
  ],
};

export function getMatchById(id: string): MockMatch | null {
  if (id === "lucia") return LUCIA;
  return null;
}

export const UNLOCK_AFTER_MESSAGES = 7; // legacy, no usar
export const MIN_MESSAGES_PER_USER = 3;
