"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

export default function ExpandableText({
  text,
  title,
  editable,
  onSave,
}: {
  text: string;
  title: string;
  editable?: boolean;
  onSave?: (newText: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [shellEl, setShellEl] = useState<Element | null>(null);
  const isLong = text.length > 100;
  const pathname = usePathname();

  // Colapsar al cambiar de página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const [draft, setDraft] = useState(text);
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Drag-to-dismiss — arrastrar desde el handle
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const DISMISS_THRESHOLD = 80;

  useEffect(() => {
    setShellEl(document.querySelector(".shell"));
  }, []);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDraft(text);
      setSaveError(null);
    }
  }, [open, text]);

  function dragStart(clientY: number) {
    startYRef.current = clientY;
    isDraggingRef.current = true;
  }
  function dragMove(clientY: number) {
    if (!isDraggingRef.current || startYRef.current === null) return;
    setDragY(Math.max(0, clientY - startYRef.current));
  }
  function dragEnd() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragY >= DISMISS_THRESHOLD) setOpen(false);
    else setDragY(0);
    startYRef.current = null;
  }

  const opacity = Math.max(0, 1 - dragY / 250);
  const hasChanged = draft.trim() !== text.trim();

  function handleSave() {
    if (!onSave) return;
    setSaveError(null);
    startSaving(async () => {
      try {
        await onSave(draft.trim());
        setOpen(false);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const sheet =
    open && shellEl
      ? createPortal(
          <div
            className="absolute inset-0 z-50 flex flex-col justify-end"
            style={{ background: `rgba(30,27,23,${0.55 * opacity})` }}
            onClick={() => setOpen(false)}
            // Seguir el arrastre aunque el cursor salga del handle
            onMouseMove={(e) => dragMove(e.clientY)}
            onMouseUp={dragEnd}
          >
            <div
              className="bg-bg rounded-t-[24px] px-5 pt-4 pb-6 h-[38vh] flex flex-col"
              style={{
                transform: `translateY(${dragY}px)`,
                transition: isDraggingRef.current ? "none" : "transform 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle — única zona de arrastre */}
              <div
                className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-4 shrink-0 py-3 cursor-grab"
                style={{ userSelect: "none" }}
                onTouchStart={(e) => dragStart(e.touches[0].clientY)}
                onTouchMove={(e) => dragMove(e.touches[0].clientY)}
                onTouchEnd={dragEnd}
                onMouseDown={(e) => { e.stopPropagation(); dragStart(e.clientY); }}
              />

              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium">
                  {title}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-bg-2 flex items-center justify-center text-ink-3 hover:text-ink text-[18px] leading-none"
                >
                  ×
                </button>
              </div>

              {editable ? (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escribe aquí…"
                    autoFocus
                    className="flex-1 resize-none text-[15px] text-ink leading-[1.75] font-light bg-transparent outline-none overflow-y-auto"
                  />
                  {saveError && (
                    <p className="text-[11px] text-rose-dark mt-1 shrink-0">{saveError}</p>
                  )}
                  {hasChanged && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="mt-3 w-full py-2.5 rounded-xl bg-ink text-bg text-[13px] disabled:opacity-50 shrink-0 transition-opacity"
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  )}
                </>
              ) : (
                <p className="flex-1 text-[15px] text-ink leading-[1.75] font-light whitespace-pre-line break-words overflow-y-auto">
                  {text}
                </p>
              )}
            </div>
          </div>,
          shellEl
        )
      : null;

  // ── Modo editable ──────────────────────────────────────────────────────────
  if (editable) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="w-full text-left">
          {text ? (
            <>
              <p className={`text-[14px] text-ink leading-[1.6] font-light whitespace-pre-line break-words ${isLong ? "line-clamp-3" : ""}`}>
                {text}
              </p>
              {isLong && (
                <span className="text-[12px] text-rose font-light mt-1 block">
                  Ver más →
                </span>
              )}
            </>
          ) : (
            <p className="text-[13px] text-ink-3 font-light">
              Toca para añadir descripción…
            </p>
          )}
        </button>
        {sheet}
      </>
    );
  }

  // ── Modo lectura ───────────────────────────────────────────────────────────
  return (
    <>
      <div>
        <p className={`text-[14px] text-ink leading-[1.6] font-light whitespace-pre-line break-words ${isLong ? "line-clamp-3" : ""}`}>
          {text}
        </p>
        {isLong && (
          <button
            onClick={() => setOpen(true)}
            className="text-[12px] text-rose font-light mt-2 hover:opacity-70 transition-opacity"
          >
            Ver más →
          </button>
        )}
      </div>
      {sheet}
    </>
  );
}
