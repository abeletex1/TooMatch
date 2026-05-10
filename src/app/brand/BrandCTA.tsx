"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

const DELAY = 4;

export default function BrandCTA() {
  const [remaining, setRemaining] = useState(DELAY);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const ready = remaining <= 0;

  if (!ready) {
    return (
      <button
        disabled
        className={`${buttonClasses("outline", true)} !py-9 !text-[14px] opacity-40 cursor-not-allowed`}
      >
        Crear mi perfil — {remaining}s
      </button>
    );
  }

  return (
    <Link
      href="/onboarding"
      className={`${buttonClasses("outline", true)} !py-9 !text-[14px]`}
    >
      Crear mi perfil →
    </Link>
  );
}
