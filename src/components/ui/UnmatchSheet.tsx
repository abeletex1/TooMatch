"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "./Button";

export default function UnmatchSheet({
  matchName,
  open,
  onClose,
  onConfirm,
}: {
  matchName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const t = useTranslations("unmatch");

  const REASONS = [
    t("reason1"),
    t("reason2"),
    t("reason3"),
    t("reason4"),
    t("reason5"),
  ];

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-ink/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-bg w-full rounded-t-[20px] px-5 pt-4 pb-7 max-h-[85%] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-bg-3 mx-auto mb-5" />

        <h2 className="font-serif text-[22px] font-medium text-ink mb-1.5 leading-[1.2]">
          {t.rich("title", {
            name: matchName,
            em: (chunks) => <em className="italic text-rose">{chunks}</em>,
          })}
        </h2>
        <p className="text-[13px] text-ink-2 font-light mb-5 leading-[1.55]">
          {t("subtitle")}
        </p>

        <div className="flex flex-col gap-2 mb-6">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`text-left px-4 py-3 rounded-xl text-[13px] font-light border-[0.5px] transition-colors ${
                reason === r
                  ? "border-rose bg-rose-light text-rose-dark"
                  : "border-border bg-bg text-ink-2 hover:bg-bg-2"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5">
          <button onClick={onClose} className={`${buttonClasses("outline")} flex-1`}>
            {t("cancel")}
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason}
            className={`${buttonClasses("rose")} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
