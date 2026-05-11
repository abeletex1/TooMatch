"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { startTransition } from "react";

export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const currentLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    const nextLocale = currentLocale === "en" ? "es" : "en";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;

    startTransition(() => {
      router.refresh();
      void pathname;
    });
  }

  return (
    <button
      onClick={toggle}
      className="text-[11px] font-medium text-ink-3 hover:text-ink transition-colors px-1.5 py-0.5 rounded border border-border"
      aria-label="Switch language"
    >
      {t("current")} / {t("switchTo")}
    </button>
  );
}
