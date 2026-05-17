"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function resetZoom() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  const original = meta.getAttribute("content") ?? "width=device-width, initial-scale=1";
  meta.setAttribute("content", "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      meta.setAttribute("content", original);
    });
  });
}

export default function ZoomReset() {
  const pathname = usePathname();

  // Prevenir pinch-zoom desde el principio (la mejor solución en iOS)
  useEffect(() => {
    const preventPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // gesturestart/gesturechange son eventos propietarios de iOS Safari
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventPinch, { passive: false });
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  // Resetear zoom al cambiar de ruta (por si acaso ya está ampliado)
  useEffect(() => {
    resetZoom();
  }, [pathname]);

  return null;
}
