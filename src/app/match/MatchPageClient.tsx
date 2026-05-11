"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";
import MatchAvatar from "@/components/ui/MatchAvatar";
import CountUp from "@/components/ui/CountUp";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import { buttonClasses } from "@/components/ui/Button";
import { markMatchViewedAction } from "./actions";
import type { RealMatch } from "@/lib/types";

export default function MatchPageClient({
  matches,
  dayNumber,
}: {
  matches: RealMatch[];
  dayNumber: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const total = matches.length;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIdx(Math.min(idx, total - 1));
  }, [total]);

  const topbarRight = total > 1 ? `${currentIdx + 1} / ${total}` : `Día ${dayNumber}`;

  if (total === 0) {
    return (
      <MobileShell>
        <Topbar right={`Día ${dayNumber}`} />
        <NoMatchToday />
        <BottomNav />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Topbar right={topbarRight} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {matches.map((match, i) => (
          <div key={match.id} className="snap-start h-full shrink-0 flex flex-col">
            <MatchHero match={match} showScrollHint={total > 1 && i < total - 1} />
          </div>
        ))}
      </div>

      <BottomNav />
    </MobileShell>
  );
}

/* ===== Hero del match ===================================================== */

function MatchHero({
  match,
  showScrollHint,
}: {
  match: RealMatch;
  showScrollHint: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("match");

  async function handleOpen() {
    if (loading) return;
    setLoading(true);
    await markMatchViewedAction(match.id);
    router.push(`/chats/${match.id}`);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-7 pb-3 text-center">
      <div className="animate-fade-up">
        <p className="text-[10px] uppercase tracking-[0.12em] text-rose font-medium mb-6">
          {t("newMatch")}
        </p>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-rose/20 animate-ping scale-110" />
            <MatchAvatar
              matchId={match.id}
              initial={match.initial}
              photoUrl={match.photos[0]}
              size="xl"
              unlocked={false}
              glowPulse
            />
          </div>
        </div>

        <div className="h-5 w-28 bg-ink/10 rounded-full mx-auto mb-1 blur-[3px]" />
        <p className="text-[12px] text-ink-2 font-light mb-3">{match.short}</p>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-bg rounded-full border-[0.5px] border-rose-mid mb-8">
          <span className="font-serif text-[20px] font-semibold text-rose leading-none">
            <CountUp target={match.compatibility} suffix="%" duration={1200} />
          </span>
          <span className="text-[11px] text-ink-2 font-light">
            {t("compatibility")}
          </span>
        </div>

        <button
          onClick={handleOpen}
          disabled={loading}
          className={`${buttonClasses("rose", true)} disabled:opacity-60`}
        >
          {loading ? t("opening") : t("viewMatch")}
        </button>
      </div>

      {showScrollHint && (
        <p className="text-center text-[11px] text-ink-3 font-light mt-8 animate-bounce">
          {t("moreMatches")}
        </p>
      )}
    </main>
  );
}

/* ===== Empty state ======================================================== */

function NoMatchToday() {
  const t = useTranslations("match");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-7 pb-3 text-center animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-bg-2 flex items-center justify-center mb-6">
        <InfinitySymbol size={36} strokeWidth={2.5} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
        {t("today")}
      </p>

      <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2]">
        {t("nextMatchTitle")}{" "}
        <em className="italic text-rose">{t("nextMatchSubtitle")}</em>
      </h2>

      <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-6" />

      <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[280px]">
        {t("nextMatchBody")}
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[280px] mt-7">
        <Link href="/question" className={buttonClasses("rose", true)}>
          {t("dailyQuestion")}
        </Link>
        <Link href="/profile" className={buttonClasses("outline", true)}>
          {t("viewProfile")}
        </Link>
      </div>
    </main>
  );
}
