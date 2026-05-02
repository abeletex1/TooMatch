"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import { logoutAction } from "@/app/logout/actions";

type Slide = {
  icon: ReactNode;
  number: string;
  title: string;
  titleEm: string;
  body: string;
  promise: string;
};

/* ===== Iconos ============================================================ */

const ROSE = "#C4735A";
const SAGE = "#6B8C7E";

function HeartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ROSE}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21 C 12 21 4 14.5 4 8.5 C 4 5.46 6.46 3 9.5 3 C 11.24 3 12 4.5 12 4.5 C 12 4.5 12.76 3 14.5 3 C 17.54 3 20 5.46 20 8.5 C 20 14.5 12 21 12 21 Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ROSE}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V7 C 8 4.79 9.79 3 12 3 C 14.21 3 16 4.79 16 7 V11" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SAGE}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12 L11 15 L16 9" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ROSE}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 18 L8 11 L12 14.5 L16 8 L21 18" />
    </svg>
  );
}

function SlideIcon({
  children,
  tone = "rose",
}: {
  children: ReactNode;
  tone?: "rose" | "sage";
}) {
  const bg =
    tone === "sage"
      ? "bg-[#E5EBE7]" // pale sage para slide 3
      : "bg-rose-light";
  return (
    <div
      className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-6 shrink-0`}
    >
      {children}
    </div>
  );
}

/* ===== Contenido de las slides =========================================== */

const slides: (Slide & { tone?: "rose" | "sage" })[] = [
  {
    icon: (
      <SlideIcon>
        <HeartIcon />
      </SlideIcon>
    ),
    number: "01 — La conexión primero",
    title: "Primero habláis.",
    titleEm: "Luego os veis.",
    body: "Aquí no hacéis match por fotos. La IA conecta personas por compatibilidad real. Las fotos se desbloquean después, cuando ya existe conversación.",
    promise: "La conexión empieza antes que la apariencia.",
  },
  {
    icon: (
      <SlideIcon>
        <LockIcon />
      </SlideIcon>
    ),
    number: "02 — Tu privacidad, protegida",
    title: "Tu perfil es",
    titleEm: "privado.",
    body: "Nadie puede verte hasta que hacéis match. Solo las personas con las que conectas pueden conocerte.",
    promise: "Tu perfil es privado. Solo tus matches pueden verte.",
  },
  {
    icon: (
      <SlideIcon tone="sage">
        <CheckCircleIcon />
      </SlideIcon>
    ),
    number: "03 — Todos tienen su oportunidad",
    title: "Al menos un match",
    titleEm: "cada día.",
    body: "Aquí no se dan likes, se crean conexiones. Too Match garantiza al menos 1 match al día para quien participa activamente.",
    promise: "Aquí no se dan likes, se crean conexiones.",
  },
  {
    icon: (
      <SlideIcon>
        <MountainIcon />
      </SlideIcon>
    ),
    number: "04 — Mejora con el tiempo",
    title: "Cuanto más tiempo,",
    titleEm: "mejores matches.",
    body: "Cuanto más respondes, más aprende la IA. El tiempo juega a tu favor.",
    promise: "Cuanto más te implicas, mejores son tus matches.",
  },
];

/* ===== Componente principal ============================================== */

export default function WelcomeSlides({ name }: { name: string | null }) {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  function next() {
    if (isLast) {
      router.push("/brand");
    } else {
      setCurrent(current + 1);
    }
  }

  function back() {
    if (!isFirst) setCurrent(current - 1);
  }

  return (
    <MobileShell>
      <Topbar right="Día 0" />

      {/* Contenido del slide. La key={current} fuerza el remount para
          que la animación fade-up se reproduzca en cada cambio. */}
      <div
        key={current}
        className="animate-fade-up flex flex-1 flex-col px-7 pt-8 pb-2"
      >
        {slide.icon}

        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 mb-3">
          {slide.number}
        </p>

        {current === 0 && name && (
          <p className="text-[13px] text-ink-2 font-light mb-1">
            Hola, <span className="text-ink font-medium">{name}</span>. Bienvenido a Too Match.
          </p>
        )}

        <h1 className="font-serif text-[32px] text-ink font-medium leading-[1.15] mb-4">
          {slide.title}
          <br />
          <em className="italic text-rose">{slide.titleEm}</em>
        </h1>

        <p className="text-[15px] text-ink-2 font-light leading-[1.65] mb-5">
          {slide.body}
        </p>

        <div className="bg-bg-2 rounded-2xl px-5 py-4 border-l-[2.5px] border-rose">
          <p className="font-serif italic text-[17px] text-ink leading-[1.5]">
            {slide.promise}
          </p>
        </div>

        {/* Watermark sutil del ∞ para llenar el espacio inferior sin
            competir con el contenido. flex-1 estira para empujar el resto
            de la slide hacia arriba. */}
        <div
          className="flex-1 flex items-center justify-center pt-4"
          aria-hidden
        >
          <div className="opacity-[0.06]">
            <InfinitySymbol size={140} />
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 py-3">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-[18px] bg-rose" : "w-1.5 bg-bg-3"
            }`}
          />
        ))}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2.5 px-7 pb-3">
        {isFirst ? (
          <button
            onClick={next}
            className={`${buttonClasses("outline")} flex-1`}
          >
            Siguiente →
          </button>
        ) : (
          <>
            <button
              onClick={back}
              className={`${buttonClasses("outline")} flex-1`}
            >
              ← Atrás
            </button>
            <button
              onClick={next}
              className={`${buttonClasses("outline")} flex-1`}
            >
              {isLast ? "Continuar →" : "Siguiente →"}
            </button>
          </>
        )}
      </div>

      {/* Logout sutil para poder probar el flujo sin crear cuentas nuevas */}
      <form action={logoutAction} className="text-center pb-4">
        <button
          type="submit"
          className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </form>
    </MobileShell>
  );
}
