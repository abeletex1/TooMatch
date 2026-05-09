"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";
import MatchAvatar from "@/components/ui/MatchAvatar";
import CountUp from "@/components/ui/CountUp";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import { buttonClasses } from "@/components/ui/Button";
import { MIN_MESSAGES_PER_USER } from "@/lib/mock/matches";
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
  const [revealedIds, setRevealedIds] = useState<Set<string>>(
    () => new Set(matches.filter((m) => !m.isNew).map((m) => m.id))
  );
  const [startedId, setStartedId] = useState<string | null>(null);

  const total = matches.length;

  // Actualizar índice según scroll vertical
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrentIdx(Math.min(idx, total - 1));
  }, [total]);

  function revealMatch(id: string) {
    setRevealedIds((prev) => new Set([...prev, id]));
  }

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

      {/* Scroll vertical con snap — cada match ocupa el alto completo */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {matches.map((match) => (
          <div key={match.id} className="snap-start h-full shrink-0 flex flex-col">
            <MatchHero
              match={match}
              revealed={revealedIds.has(match.id)}
              onReveal={() => revealMatch(match.id)}
              started={startedId === match.id}
              onStart={() => setStartedId(match.id)}
              showScrollHint={total > 1 && matches.indexOf(match) < total - 1}
            />
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
  revealed,
  onReveal,
  started,
  onStart,
  showScrollHint,
}: {
  match: RealMatch;
  revealed: boolean;
  onReveal: () => void;
  started: boolean;
  onStart: () => void;
  showScrollHint: boolean;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (match.isNew) markMatchViewedAction(match.id);
  }, [match.id, match.isNew]);

  function handleStart() {
    onStart();
    setTimeout(() => router.push(`/chats/${match.id}`), 2200);
  }

  if (started) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-7 pb-3 text-center animate-fade-up">
        <InfinitySymbol size={44} strokeWidth={2} />
        <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2] mt-6">
          Conversación{" "}
          <em className="italic text-rose">iniciada.</em>
        </h2>
        <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-5" />
        <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[260px]">
          Tu siguiente match será más certero.
        </p>
        <Link
          href={`/chats/${match.id}`}
          className="mt-8 text-[13px] text-rose font-light underline underline-offset-4"
        >
          Ir al chat →
        </Link>
      </main>
    );
  }

  if (!revealed) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-7 pb-3 text-center">
        <div className="animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.12em] text-rose font-medium mb-6">
            ✦ Tienes un nuevo match ✦
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

          {/* Nombre oculto */}
          <div className="h-5 w-28 bg-ink/10 rounded-full mx-auto mb-1 blur-[3px]" />
          <p className="text-[12px] text-ink-2 font-light mb-8">{match.short}</p>

          <button
            onClick={onReveal}
            className={`${buttonClasses("rose", true)}`}
          >
            Ver tu match →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-3">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-rose-light to-bg-2 px-5 pt-7 pb-6 text-center mb-4 animate-hero-reveal">
        <div className="absolute -top-5 -right-5 w-[120px] h-[120px] rounded-full bg-rose/[0.08]" />
        <div className="absolute -bottom-8 -left-8 w-[100px] h-[100px] rounded-full bg-rose/[0.05]" />

        <p className="text-[10px] uppercase tracking-[0.12em] text-rose font-medium mb-4 relative">
          ✦ Tu match de hoy ✦
        </p>

        <div className="flex justify-center mb-3.5 relative">
          <MatchAvatar
            matchId={match.id}
            initial={match.initial}
            photoUrl={match.photos[0]}
            size="xl"
            href={`/match-profile/${match.id}`}
            unlocked={false}
            glowPulse
          />
        </div>

        {/* Nombre oculto — barra borrosa */}
        <div className="h-6 w-32 bg-ink/10 rounded-full mx-auto mb-1 relative blur-[3px]" />
        <p className="text-[12px] text-ink-2 font-light mt-1 mb-4 relative">
          {match.short}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-bg rounded-full border-[0.5px] border-rose-mid relative">
          <span className="font-serif text-[20px] font-semibold text-rose leading-none">
            <CountUp target={match.compatibility} suffix="%" duration={1400} />
          </span>
          <span className="text-[11px] text-ink-2 font-light">
            compatibilidad
          </span>
        </div>
      </section>

      {/* Breakdown */}
      <section className="bg-bg-2 rounded-2xl px-4 py-3.5 mb-4">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-2.5">
          Por qué encajáis
        </p>
        {match.breakdown.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5 my-2">
            <span className="text-[12px] text-ink-2 font-light w-[80px]">
              {row.label}
            </span>
            <div className="flex-1 h-[4px] bg-bg-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose rounded-full transition-all"
                style={{ width: `${row.pct}%` }}
              />
            </div>
            <span className="text-[12px] text-ink font-medium w-[36px] text-right">
              {row.pct}%
            </span>
          </div>
        ))}
      </section>

      {/* Tags compartidos */}
      {match.sharedTags.length > 0 && (
        <section className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-2">
            Compartís
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.sharedTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[11px] bg-rose-light text-rose-dark border-[0.5px] border-rose-mid font-light"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Lock row */}
      <div className="bg-bg-2 rounded-xl px-3.5 py-3 flex items-start gap-2.5 mb-3">
        <div className="w-[6px] h-[6px] rounded-full bg-rose shrink-0 mt-[6px]" />
        <p className="text-[12px] text-ink-2 font-light leading-[1.5]">
          <span className="text-ink">Su foto está borrosa.</span> Se desbloquea
          cuando cada uno haya enviado {MIN_MESSAGES_PER_USER} mensajes — la
          conversación primero.
        </p>
      </div>

      <button
        onClick={handleStart}
        className={`${buttonClasses("rose", true)} mt-2`}
      >
        Iniciar conversación →
      </button>

      {/* Hint de scroll si hay más matches debajo */}
      {showScrollHint && (
        <p className="text-center text-[11px] text-ink-3 font-light mt-5 animate-bounce">
          ↓ Más matches
        </p>
      )}
    </main>
  );
}

/* ===== Empty state ======================================================== */

function NoMatchToday() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-7 pb-3 text-center animate-fade-up">
      <div className="w-16 h-16 rounded-2xl bg-bg-2 flex items-center justify-center mb-6">
        <InfinitySymbol size={36} strokeWidth={2.5} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
        Hoy
      </p>

      <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2]">
        Tu próximo match{" "}
        <em className="italic text-rose">llega mañana.</em>
      </h2>

      <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-6" />

      <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[280px]">
        Mientras tanto, sigue afinando tu perfil o responde la pregunta del
        día. Cuanto más participas, mejores son tus matches.
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[280px] mt-7">
        <Link href="/question" className={buttonClasses("rose", true)}>
          Pregunta del día
        </Link>
        <Link href="/profile" className={buttonClasses("outline", true)}>
          Ver mi perfil
        </Link>
      </div>
    </main>
  );
}
