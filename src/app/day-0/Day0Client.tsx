"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/Button";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { logoutAction } from "@/app/logout/actions";
import { usePush } from "@/lib/use-push";

export default function Day0Client({ nextHref, isFactorial = false }: { nextHref: string; isFactorial?: boolean }) {
  const { supported, subscribed, loading, subscribe } = usePush();
  const [decided, setDecided] = useState(false);
  const t = useTranslations("day0");
  const tCommon = useTranslations("common");

  const showNotifCard = supported && !subscribed && !decided;

  async function handleActivate() {
    await subscribe();
    setDecided(true);
  }

  function handleSkip() {
    setDecided(true);
  }

  return (
    <MobileShell>
      <Topbar right={tCommon("day0")} />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-light flex items-center justify-center mb-6">
          <InfinitySymbol size={36} strokeWidth={2.5} />
        </div>

        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
          {tCommon("day0")}
        </p>

        {isFactorial ? (
          <>
            <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-3">
              Perfil <em className="italic text-rose">completado.</em>
            </h1>
            <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[300px]">
              Recibirás tu match el <span className="text-ink font-medium">viernes 22</span> en el Facts.
            </p>
            <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-7" />
            <p className="font-serif italic text-[16px] text-ink leading-[1.5] max-w-[280px]">
              Mientras tanto, contesta las preguntas diarias para que tu match sea lo más compatible posible.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-3">
              {t("title1")} <em className="italic text-rose">{t("title2")}</em>
            </h1>
            <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[300px]">
              {t("subtitle1")} <span className="text-ink">{t("subtitle2")}</span>. {t("body1")}
            </p>
            <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-7" />
            <p className="font-serif italic text-[16px] text-ink leading-[1.5] max-w-[280px]">
              {t("body2")}
            </p>
          </>
        )}

        {showNotifCard ? (
          <div className="w-full mt-10 bg-bg-2 rounded-2xl px-5 py-5 text-left border-[0.5px] border-border">
            <p className="text-[10px] uppercase tracking-[0.12em] text-rose font-medium mb-2">
              {t("notifCta")}
            </p>
            <p className="text-[13px] text-ink font-medium mb-1">
              {t("notifTitle")}
            </p>
            <p className="text-[12px] text-ink-2 font-light leading-[1.6] mb-4">
              {t("notifBody")}
            </p>
            <button
              onClick={handleActivate}
              disabled={loading}
              className={`${buttonClasses("rose", true)} disabled:opacity-60`}
            >
              {loading ? t("notifActivating") : t("notifButton")}
            </button>
            <button
              onClick={handleSkip}
              className="w-full mt-2.5 text-[12px] text-ink-3 font-light py-1 hover:text-ink-2 transition-colors"
            >
              {t("notifLater")}
            </button>
          </div>
        ) : (
          <Link href={nextHref} className={`${buttonClasses("rose", true)} mt-12`}>
            {t("viewHome")}
          </Link>
        )}

      </main>
    </MobileShell>
  );
}
