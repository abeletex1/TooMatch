"use client";

import Link from "next/link";

type Size = "sm" | "md" | "lg" | "xl";

const PX: Record<Size, number> = { sm: 38, md: 60, lg: 80, xl: 88 };
const BORDER: Record<Size, string> = {
  sm: "border",
  md: "border",
  lg: "border-2",
  xl: "border-2",
};
const FALLBACK_TEXT: Record<Size, string> = {
  sm: "text-[15px]",
  md: "text-[20px]",
  lg: "text-[28px]",
  xl: "text-[32px]",
};

/**
 * Avatar del match.
 *
 * - Si `photoUrl` existe y `unlocked` es false → foto con blur fuerte.
 * - Si `photoUrl` existe y `unlocked` es true → foto nítida.
 * - Sin `photoUrl` → inicial italic.
 * - Si se pasa `href`, el avatar es un Link SOLO cuando está desbloqueado.
 *
 * El estado desbloqueado se recibe como prop; el padre lo calcula a partir
 * del conteo de mensajes en DB (no localStorage).
 */
export default function MatchAvatar({
  matchId,
  initial,
  photoUrl,
  size = "md",
  href,
  unlocked = false,
  shadow = false,
  glowPulse = false,
}: {
  matchId: string;
  initial: string;
  photoUrl?: string;
  size?: Size;
  href?: string;
  unlocked?: boolean;
  shadow?: boolean;
  glowPulse?: boolean;
}) {
  const px = PX[size];

  const blurClass = unlocked
    ? ""
    : size === "sm"
    ? "blur-[6px] scale-110"
    : "blur-[14px] scale-110";

  const shadowClass = glowPulse
    ? "animate-glow-pulse"
    : shadow
    ? "shadow-[0_4px_20px_rgba(196,115,90,0.15)]"
    : "";

  const inner = (
    <div
      className={`rounded-full bg-bg ${BORDER[size]} border-rose-mid overflow-hidden flex items-center justify-center shrink-0 ${shadowClass}`}
      style={{ width: px, height: px }}
      data-match-id={matchId}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`${initial}.`}
          className={`w-full h-full object-cover transition-[filter,transform] duration-700 ${blurClass}`}
        />
      ) : (
        <span className={`font-serif italic text-rose ${FALLBACK_TEXT[size]}`}>
          {initial}
        </span>
      )}
    </div>
  );

  if (href && unlocked) {
    return (
      <Link
        href={href}
        aria-label="Ver perfil"
        className="hover:opacity-90 transition-opacity"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
