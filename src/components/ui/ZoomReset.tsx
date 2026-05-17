"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resetea el zoom del viewport iOS al cambiar de ruta.
 * iOS 10+ ignora user-scalable=no por accesibilidad, así que
 * la única forma de resetear el zoom es manipular el meta viewport via JS.
 */
export default function ZoomReset() {
  const pathname = usePathname();

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    // Forzar reset de zoom en iOS: temporarily set initial-scale=1
    const original = meta.getAttribute("content") ?? "width=device-width, initial-scale=1";
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1"
    );
    const timer = setTimeout(() => {
      meta.setAttribute("content", original);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
