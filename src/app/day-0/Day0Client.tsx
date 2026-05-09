"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { logoutAction } from "@/app/logout/actions";
import { usePush } from "@/lib/use-push";

export default function Day0Client({
  nextHref,
}: {
  nextHref: string;
}) {
  const { supported, subscribed, loading, subscribe } = usePush();
  const [decided, setDecided] = useState(false);

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
      <Topbar right="Día 0" />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-rose-light flex items-center justify-center mb-6">
          <InfinitySymbol size={36} strokeWidth={2.5} />
        </div>

        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
          Día 0
        </p>

        <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-3">
          Perfil <em className="italic text-rose">completado.</em>
        </h1>

        <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[300px]">
          Mañana llega tu <span className="text-ink">primer match</span>. Lo
          eligimos con calma para que tenga sentido — sin scroll, sin prisa.
        </p>

        <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-7" />

        <p className="font-serif italic text-[16px] text-ink leading-[1.5] max-w-[280px]">
          Lo bueno se hace esperar. Un día.
        </p>

        {/* Card de notificaciones — solo si aplica y no ha decidido */}
        {showNotifCard ? (
          <div className="w-full mt-10 bg-bg-2 rounded-2xl px-5 py-5 text-left border-[0.5px] border-border">
            <p className="text-[10px] uppercase tracking-[0.12em] text-rose font-medium mb-2">
              ✦ No te pierdas tu match
            </p>
            <p className="text-[13px] text-ink font-medium mb-1">
              Activa las notificaciones
            </p>
            <p className="text-[12px] text-ink-2 font-light leading-[1.6] mb-4">
              Te avisamos cuando llegue tu match y cuando tu conversación avance. Sin spam.
            </p>
            <button
              onClick={handleActivate}
              disabled={loading}
              className={`${buttonClasses("rose", true)} disabled:opacity-60`}
            >
              {loading ? "Activando…" : "Activar notificaciones →"}
            </button>
            <button
              onClick={handleSkip}
              className="w-full mt-2.5 text-[12px] text-ink-3 font-light py-1 hover:text-ink-2 transition-colors"
            >
              Ahora no
            </button>
          </div>
        ) : (
          <Link
            href={nextHref}
            className={`${buttonClasses("rose", true)} mt-12`}
          >
            Ver mi inicio
          </Link>
        )}

        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
    </MobileShell>
  );
}
