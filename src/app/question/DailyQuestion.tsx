"use client";

import { useState, useTransition } from "react";
import { saveAnswerAction } from "./actions";

type HistoryItem = {
  question_text: string;
  answer: string;
  active_date: string;
};

export default function DailyQuestion({
  questionId,
  questionText,
  options,
  initialAnswer,
  history,
}: {
  questionId: string;
  questionText: string;
  options: string[];
  initialAnswer: string | null;
  history: HistoryItem[];
}) {
  const [tab, setTab] = useState<"hoy" | "historial">("hoy");
  const [pending, setPending] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(initialAnswer);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(history);
  const [isPending, startTransition] = useTransition();

  function select(option: string) {
    if (saved !== null || isPending) return;
    setPending(option);
  }

  function submit() {
    if (!pending) return;
    startTransition(async () => {
      await saveAnswerAction(questionId, pending);
      setSaved(pending);
      // Añadir la respuesta al historial local para verla inmediatamente
      setLocalHistory((prev) => [
        {
          question_text: questionText,
          answer: pending,
          active_date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
      setPending(null);
    });
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-2 rounded-xl p-1 mb-4">
        {(["hoy", "historial"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-light transition-colors capitalize ${
              tab === t
                ? "bg-bg text-ink shadow-sm"
                : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {t === "hoy" ? "Hoy" : "Mis respuestas"}
          </button>
        ))}
      </div>

      {tab === "hoy" && (
        <>
          {!saved ? (
            <>
              <div className="bg-bg-2 rounded-2xl p-4 mb-3">
                <p className="font-serif italic text-[17px] text-ink leading-[1.45] mb-4">
                  {questionText}
                </p>
                <div className="flex flex-col gap-2">
                  {options.map((opt) => {
                    const isPicked = pending === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => select(opt)}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-[13px] font-light border-[0.5px] transition-colors ${
                          isPicked
                            ? "border-rose bg-rose-light text-rose-dark"
                            : "border-border bg-bg text-ink-2 hover:bg-bg-2"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {pending && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={submit}
                  className="w-full py-3 rounded-xl bg-ink text-bg text-[13px] font-light disabled:opacity-40 transition-opacity mb-3"
                >
                  {isPending ? "Enviando…" : "Enviar respuesta →"}
                </button>
              )}
            </>
          ) : (
            <div className="animate-fade-up bg-rose-light border-[0.5px] border-rose-mid rounded-xl px-4 py-3.5 text-center">
              <p className="font-serif italic text-[15px] text-rose-dark leading-[1.45]">
                Anotado. Mañana otra pregunta —{" "}
                <span className="text-rose">cada respuesta afina tus matches</span>.
              </p>
            </div>
          )}
        </>
      )}

      {tab === "historial" && (
        <div className="flex flex-col gap-3">
          {localHistory.length === 0 ? (
            <div className="bg-bg-2 rounded-2xl p-5 text-center">
              <p className="font-serif italic text-[15px] text-ink-3">
                Aún no has respondido ninguna pregunta.
              </p>
            </div>
          ) : (
            localHistory.map((item, i) => (
              <div key={i} className="bg-bg-2 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-1.5">
                  {new Date(item.active_date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="font-serif italic text-[15px] text-ink leading-[1.4] mb-2">
                  {item.question_text}
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-light border-[0.5px] border-rose-mid text-[12px] text-rose-dark font-light">
                  {item.answer}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
