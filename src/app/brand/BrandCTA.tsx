"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";

const DELAY = 4;

export default function BrandCTA() {
  const [remaining, setRemaining] = useState(DELAY);
  const t = useTranslations("brand");

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const ready = remaining <= 0;

  if (!ready) {
    return (
      <button
        disabled
        className={`${buttonClasses("outline", true)} !py-9 !text-[14px] opacity-40 cursor-not-allowed`}
      >
        {t("ctaCountdown", { remaining })}
      </button>
    );
  }

  return (
    <Link
      href="/onboarding"
      className={`${buttonClasses("outline", true)} !py-9 !text-[14px]`}
    >
      {t("ctaReady")}
    </Link>
  );
}
