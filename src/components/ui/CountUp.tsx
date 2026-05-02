"use client";

import { useEffect, useState } from "react";

/**
 * Anima un número de 0 a `target` con easing cubic-out.
 * Usado por ejemplo para el % de compatibilidad del match del día —
 * pasa de 0 → 87 cuando entra la pantalla, dándole "reveal" en vez de
 * que aparezca de golpe.
 */
export default function CountUp({
  target,
  duration = 1400,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3); // cubic-out
      setValue(Math.round(target * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}
