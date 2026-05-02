"use client";

import { useEffect, useState } from "react";

const KEY = (id: string) => `too-match:unmatched:${id}`;
const UNLOCKED_KEY = (id: string) => `too-match:unlocked:${id}`;

export type UnmatchedState = {
  unmatched: boolean;
  reason: string | null;
};

/**
 * Indica si el match con id `matchId` está deshecho. Por ahora la verdad
 * vive en localStorage; cuando exista la tabla `matches`, esto pasará a
 * leer del backend (e.g. matches.status = 'unmatched').
 */
export function useMatchUnmatched(matchId: string): UnmatchedState {
  const [state, setState] = useState<UnmatchedState>({
    unmatched: false,
    reason: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const r = window.localStorage.getItem(KEY(matchId));
      setState({ unmatched: r !== null, reason: r });
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY(matchId)) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [matchId]);

  return state;
}

/** Marca un match como deshecho, guardando la razón. */
export function setMatchUnmatched(matchId: string, reason: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY(matchId), reason);
  // Si estaba desbloqueado, también lo limpiamos: el match ya no existe.
  window.localStorage.removeItem(UNLOCKED_KEY(matchId));
  window.dispatchEvent(
    new StorageEvent("storage", { key: KEY(matchId), newValue: reason })
  );
}
