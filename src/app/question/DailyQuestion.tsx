"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveAnswerAction } from "./actions";

type Question = {
  id: string;
  question_text: string;
  options: string[];
  active_date: string;
};

type HistoryItem = {
  question_text: string;
  answer: string;
  active_date: string;
};

export default function DailyQuestion({
  questions,
  history,
}: {
  questions: Question[];
  history: HistoryItem[];
}) {
  const t = useTranslations("question");
  const [tab, setTab] = useState<"hoy" | "historial">("hoy");
  const [pending, setPending] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(history);
  const [answered, setAnswered] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const remaining = questions.filter((q) => !answered.includes(q.id));
  const current = remaining[0] ?? null;
  const allDone = remaining.length === 0;

  function select(option: string) {
    if (isPending) return;
    setPending(option);
  }

  function submit() {
    if (!pending || !current) return;
    startTransition(async () => {
      await saveAnswerAction(current.id, pending);
      setLocalHistory((prev) => [
        { question_text: current.question_text, answer: pending, active_date: current.active_date },
        ...prev,
      ]);
      setAnswered((prev) => [...prev, current.id]);
      setPending(null);
    });
  }

  const TABS = [
    { key: "hoy" as const, label: remaining.length > 1 ? t("pending", { count: remaining.length }) : t("today") },
    { key: "historial" as const, label: t("myAnswers") },
  ];

  return (
    <>
      <div className="flex gap-1 bg-bg-2 rounded-xl p-1 mb-4">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-light transition-colors capitalize ${
              tab === tabItem.key ? "bg-bg text-ink shadow-sm" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "hoy" && (
        <>
          {allDone ? (
            <div className="animate-fade-up bg-rose-light border-[0.5px] border-rose-mid rounded-xl px-4 py-3.5 text-center">
              <p className="font-serif italic text-[15px] text-rose-dark leading-[1.45]">
                {t("upToDate")}{" "}
                <span className="text-rose">{t("upToDateSub")}</span>.
              </p>
            </div>
          ) : (
            <>
              {remaining.length > 1 && (
                <p className="text-[11px] text-ink-3 font-light mb-3">
                  {t("pendingNote", { count: remaining.length })}
                </p>
              )}

              <div className="bg-bg-2 rounded-2xl p-4 mb-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-2">
                  {new Date(current!.active_date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="font-serif italic text-[17px] text-ink leading-[1.45] mb-4">
                  {current!.question_text}
                </p>
                <div className="flex flex-col gap-2">
                  {current!.options.map((opt) => {
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
                  {isPending
                    ? "Enviando…"
                    : remaining.length > 1
                    ? "Enviar y siguiente →"
                    : "Enviar respuesta →"}
                </button>
              )}
            </>
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
