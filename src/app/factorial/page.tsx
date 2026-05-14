"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function FactorialPage() {
  const [answered, setAnswered] = useState(false);
  const router = useRouter();

  function handleYes() {
    localStorage.setItem("too-match:event", "factorial");
    router.push("/signup");
  }

  function handleNo() {
    localStorage.removeItem("too-match:event");
    router.push("/signup");
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-7 py-10">
      <div className="w-full max-w-[390px] flex flex-col items-center text-center animate-fade-up">

        {/* Logo */}
        <div className="mb-2">
          <Logo size="sm" align="center" />
        </div>
        <p className="font-serif italic text-[13px] text-ink-3 mb-10">
          Stop likes. Start match.
        </p>

        {!answered ? (
          /* ── Pregunta inicial ── */
          <>
            <p className="text-[11px] uppercase tracking-[0.14em] text-rose font-medium mb-3">
              Facts 2025 · Edición especial
            </p>
            <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-3">
              ¿Formas parte del{" "}
              <em className="italic text-rose">equipo de Factorial</em>?
            </h1>
            <p className="text-[13px] text-ink-2 font-light leading-[1.6] mb-8 max-w-[300px]">
              Así encontramos tu match entre los compañeros que participan esta semana.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleYes}
                className="w-full py-4 rounded-2xl bg-ink text-bg text-[14px] font-light tracking-wide hover:opacity-90 transition-opacity"
              >
                Sí, soy del equipo →
              </button>
              <button
                onClick={handleNo}
                className="w-full py-3.5 rounded-2xl border-[0.5px] border-border-strong text-ink-2 text-[14px] font-light hover:bg-bg-2 transition-colors"
              >
                No, solo me han invitado
              </button>
            </div>

            <p className="text-[12px] text-ink-3 font-light mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-rose-dark underline underline-offset-2">
                Entrar
              </Link>
            </p>
          </>
        ) : null}

        {/* Footer discreto */}
        <p className="text-[10px] text-ink-3 font-light mt-10 opacity-60">
          Too Match · Solo disponible para participantes de Facts
        </p>
      </div>
    </div>
  );
}
