"use client";

import { useEffect, useState } from "react";

const KEY = (id: string) => `too-match:unlocked:${id}`;

/**
 * Indica si el match con id `matchId` tiene las fotos desbloqueadas.
 * Por ahora la verdad vive en localStorage y se persiste cuando la
 * conversación cruza UNLOCK_AFTER_MESSAGES. Cuando exista la tabla
 * `messages`, esto pasará a leer del backend.
 */
export function useMatchUnlocked(matchId: string): boolean {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () =>
      setUnlocked(window.localStorage.getItem(KEY(matchId)) === "true");
    read();
    // Cambios en otra pestaña / componente
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY(matchId)) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [matchId]);

  return unlocked;
}

/** Marca un match como desbloqueado o lo resetea. */
export function setMatchUnlocked(matchId: string, value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(KEY(matchId), "true");
  } else {
    window.localStorage.removeItem(KEY(matchId));
  }
  // Forzamos evento storage incluso en la misma pestaña
  window.dispatchEvent(
    new StorageEvent("storage", { key: KEY(matchId), newValue: value ? "true" : null })
  );
}
