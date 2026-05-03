"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import Logo from "./Logo";

export default function Topbar({
  back,
  right,
  scrollRef,
}: {
  back?: string;
  right?: ReactNode;
  scrollRef?: React.RefObject<HTMLElement | null>;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    function onScroll() {
      const y = el!.scrollTop;
      // Ocultar al bajar, mostrar al subir
      if (y > lastY.current && y > 40) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY.current = y;
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <div
      className={`flex items-center justify-between px-5 pt-[14px] pb-[11px] border-b-[0.5px] border-border bg-bg shrink-0 topbar-scroll${hidden ? " topbar-hide" : ""}`}
    >
      <div className="flex items-center gap-3">
        {back ? (
          <Link
            href={back}
            aria-label="Volver"
            className="text-rose text-[22px] leading-none -ml-1 px-1 hover:opacity-70"
          >
            ←
          </Link>
        ) : null}
        <Logo size="sm" align="left" />
      </div>
      {right ? <div className="text-[11px] text-ink-3">{right}</div> : null}
    </div>
  );
}
