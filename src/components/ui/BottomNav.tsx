"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/* ===== Iconos pequeños =================================================== */

function QuestionIcon({ active }: { active: boolean }) {
  const stroke = active ? "#C4735A" : "#A8A099";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9 C 9.5 7.5 10.7 6.5 12 6.5 C 13.3 6.5 14.5 7.5 14.5 9 C 14.5 10.5 12 11 12 13" />
      <circle cx="12" cy="16.5" r="0.5" fill={stroke} />
    </svg>
  );
}

function MatchIcon({ active }: { active: boolean }) {
  const stroke = active ? "#C4735A" : "#A8A099";
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 60 30"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 45 5 C 57.74 5 57.74 25 45 25 C 32.26 25 27.16 5 15 5 C 3.55 5 3.55 25 15 25 C 27.16 25 32.26 5 45 5 Z" />
    </svg>
  );
}

function ChatsIcon({ active }: { active: boolean }) {
  const stroke = active ? "#C4735A" : "#A8A099";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const stroke = active ? "#C4735A" : "#A8A099";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 C 4 16 8 14 12 14 C 16 14 20 16 20 21" />
    </svg>
  );
}

/* ===== Componente ======================================================== */

type Tab = {
  href: string;
  label: string;
  icon: (props: { active: boolean }) => ReactNode;
};

const TABS: Tab[] = [
  { href: "/question", label: "Pregunta", icon: QuestionIcon },
  { href: "/match", label: "Match", icon: MatchIcon },
  { href: "/chats", label: "Chats", icon: ChatsIcon },
  { href: "/profile", label: "Perfil", icon: ProfileIcon },
];

/**
 * Barra inferior de navegación entre las 4 secciones principales del Día 1+.
 * Se monta dentro del MobileShell, debajo de la pantalla activa.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-t-[0.5px] border-border bg-bg pt-2.5 pb-1.5 shrink-0">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center gap-1 py-1"
          >
            <Icon active={active} />
            <span
              className={`text-[9px] tracking-[0.07em] uppercase ${
                active ? "text-rose" : "text-ink-3"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
