"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRelationshipIntentAction } from "./actions";

const OPTIONS = [
  "Una relación seria",
  "Conocer gente y ver qué pasa",
  "Algo casual, sin compromiso",
  "Amistad",
];

export default function IntroQuestion() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!selected) return;
    startTransition(async () => {
      await saveRelationshipIntentAction(selected);
      setSaved(true);
    });
  }

  if (saved) {
    return (
      <div className="animate-fade-up flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-light flex items-center justify-center mb-6 text-[22px]">
          ✦
        </div>

        <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2] mb-4">
          Anotado.{" "}
          <em className="italic text-rose">Gracias por la honestidad.</em>
        </h2>

        <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-5" />

        <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[280px] mb-3">
          Cada día recibirás una pregunta que nos permitirá conseguirte mejores matches.
        </p>
        <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[280px] mb-8">
          Si no la contestas un día, se acumula — puedes responderlas todas cuando quieras.
        </p>

        <button
          onClick={() => router.push("/match")}
          className="w-full max-w-[280px] py-3.5 rounded-2xl bg-rose text-white text-[14px] font-light tracking-wide"
        >
          Empezar →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
        Antes de empezar
      </p>
      <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2] mb-2">
        ¿Qué estás buscando{" "}
        <em className="italic text-rose">realmente</em>?
      </h2>
      <p className="text-[13px] text-ink-2 font-light leading-[1.65] mb-6">
        Sé honesto. Solo tú ves esta respuesta y nos ayuda a no hacerte perder el tiempo.
      </p>

      <div className="flex flex-col gap-2.5 mb-6">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSelected(opt)}
            className={`text-left px-4 py-3.5 rounded-2xl text-[14px] font-light border-[0.5px] transition-colors ${
              selected === opt
                ? "border-rose bg-rose-light text-rose-dark"
                : "border-border-strong bg-bg text-ink-2 hover:bg-bg-2"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected && (
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="w-full py-3.5 rounded-2xl bg-ink text-bg text-[14px] font-light disabled:opacity-40 transition-opacity"
        >
          {isPending ? "Guardando…" : "Continuar →"}
        </button>
      )}
    </div>
  );
}
