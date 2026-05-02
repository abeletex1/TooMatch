"use client";

import { useState } from "react";
import { buttonClasses } from "./Button";

const REASONS = [
  "No conectamos",
  "Cambié de opinión",
  "No es el momento",
  "No me siento cómodo/a",
  "Comportamiento inadecuado",
];

/**
 * Bottom sheet para deshacer un match. Pide razón antes de confirmar.
 * Se renderiza dentro del MobileShell (que tiene position: relative)
 * con un overlay que cubre solo el marco del móvil.
 */
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
        {/* Handle decorativo arriba del sheet */}
        <div className="w-10 h-1 rounded-full bg-bg-3 mx-auto mb-5" />

        <h2 className="font-serif text-[22px] font-medium text-ink mb-1.5 leading-[1.2]">
          ¿Deshacer match con{" "}
          <em className="italic text-rose">{matchName}</em>?
        </h2>
        <p className="text-[13px] text-ink-2 font-light mb-5 leading-[1.55]">
          Esta acción no se puede deshacer. Cuéntanos por qué — nos ayuda a
          presentarte mejores matches.
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
          <button
            onClick={onClose}
            className={`${buttonClasses("outline")} flex-1`}
          >
            Cancelar
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason}
            className={`${buttonClasses("rose")} flex-1 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Deshacer match
          </button>
        </div>
      </div>
    </div>
  );
}
