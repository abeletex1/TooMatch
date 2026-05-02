"use client";

import { useState, useTransition } from "react";
import { saveAnswerAction } from "./actions";

export default function DailyQuestion({
  questionId,
  questionText,
  options,
  initialAnswer,
}: {
  questionId: string;
  questionText: string;
  options: string[];
  initialAnswer: string | null;
}) {
  const [picked, setPicked] = useState<string | null>(initialAnswer);
  const [isPending, startTransition] = useTransition();

  function choose(option: string) {
    if (picked !== null || isPending) return;
    setPicked(option);
    startTransition(async () => {
      await saveAnswerAction(questionId, option);
    });
  }

  return (
    <>
      <div className="bg-bg-2 rounded-2xl p-4 mb-3">
        <p className="font-serif italic text-[17px] text-ink leading-[1.45] mb-4">
          {questionText}
        </p>
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const isPicked = picked === opt;
            const someoneElsePicked = picked !== null && !isPicked;
            return (
              <button
                key={opt}
                type="button"
                disabled={picked !== null || isPending}
                onClick={() => choose(opt)}
                className={`text-left px-3.5 py-2.5 rounded-xl text-[13px] font-light border-[0.5px] transition-colors ${
                  isPicked
                    ? "border-rose bg-rose-light text-rose-dark"
                    : someoneElsePicked
                    ? "border-border bg-bg text-ink-3 opacity-60"
                    : "border-border bg-bg text-ink-2 hover:bg-bg-2"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {picked !== null ? (
        <div className="animate-fade-up bg-rose-light border-[0.5px] border-rose-mid rounded-xl px-4 py-3.5 text-center">
          <p className="font-serif italic text-[15px] text-rose-dark leading-[1.45]">
            Anotado. Mañana otra pregunta —{" "}
            <span className="text-rose">cada respuesta afina tus matches</span>.
          </p>
        </div>
      ) : null}
    </>
  );
}
