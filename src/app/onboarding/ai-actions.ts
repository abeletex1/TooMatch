"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS = {
  self: `You help users tidy up what they've written about themselves in a dating app.
The user has written or dictated the following in an informal or disorganized way.

Your ONLY job: fix spelling and punctuation, join fragmented sentences, improve readability.
STRICT RULES:
- Do NOT add any new ideas, adjectives, or phrases that aren't already in the text.
- Do NOT change the meaning or add anything the user hasn't said.
- Keep the exact same personal tone and first-person voice.
- Respond in the same language as the input text.
- Return only the cleaned text, no explanations or quotes.`,

  partner: `You help users tidy up what they've written about what they're looking for in a partner in a dating app.
The user has written or dictated the following in an informal or disorganized way.

Your ONLY job: fix spelling and punctuation, join fragmented sentences, improve readability.
STRICT RULES:
- Do NOT add any new ideas, adjectives, or phrases that aren't already in the text.
- Do NOT change the meaning or add anything the user hasn't said.
- Keep the exact same personal tone and first-person voice.
- Respond in the same language as the input text.
- Return only the cleaned text, no explanations or quotes.`,
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
