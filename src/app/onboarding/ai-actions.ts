"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS = {
  self: `Eres un asistente que ayuda a personas a presentarse en una app de citas llamada Too Match.
El usuario ha escrito o dictado lo siguiente sobre sí mismo de forma desordenada o informal.
Reescríbelo en primera persona, de forma natural, honesta y cercana.
Mantén exactamente el mismo significado y tono personal — no añadas nada que no esté en el texto original.
Devuelve solo el texto reescrito, sin explicaciones ni comillas.`,

  partner: `Eres un asistente que ayuda a personas a describir qué buscan en una pareja en una app de citas llamada Too Match.
El usuario ha escrito o dictado lo siguiente de forma desordenada o informal.
Reescríbelo en primera persona, de forma natural y clara.
Mantén exactamente el mismo significado — no añadas nada que no esté en el texto original.
Devuelve solo el texto reescrito, sin explicaciones ni comillas.`,
};

export async function organizeTextAction(
  text: string,
  field: "self" | "partner"
): Promise<{ text?: string; error?: string }> {
  if (!text.trim()) return { error: "Sin texto." };
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PROMPTS[field] },
        { role: "user", content: text },
      ],
      max_tokens: 300,
      temperature: 0.6,
    });
    return { text: response.choices[0].message.content ?? text };
  } catch {
    return { error: "Error al procesar el texto." };
  }
}

export async function transcribeAndOrganizeAction(
  formData: FormData,
  field: "self" | "partner"
): Promise<{ text?: string; error?: string }> {
  const audioFile = formData.get("audio") as File | null;
  if (!audioFile) return { error: "Sin audio." };
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "es",
    });
    if (!transcription.text.trim()) return { error: "No se detectó voz." };
    return organizeTextAction(transcription.text, field);
  } catch {
    return { error: "Error al transcribir el audio." };
  }
}
