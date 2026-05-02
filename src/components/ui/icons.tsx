/**
 * Iconos pequeños para tarjetas de perfil. Color por defecto = currentColor
 * (el padre decide vía text-{color}).
 */

type IconProps = { size?: number; className?: string };

const baseProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function QuoteIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M7 9 C 5 9 5 11 5 12 V14 C 5 15 6 16 7 16 H 9 V 11 C 9 10 8 9 7 9 Z" />
      <path d="M15 9 C 13 9 13 11 13 12 V14 C 13 15 14 16 15 16 H 17 V 11 C 17 10 16 9 15 9 Z" />
    </svg>
  );
}

export function IDCardIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <line x1="14" y1="10" x2="18" y2="10" />
      <line x1="14" y1="13.5" x2="18" y2="13.5" />
      <path d="M6 16.5 C 7 15 11 15 12 16.5" />
    </svg>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="11" cy="11" r="6" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
    </svg>
  );
}

export function TagIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M3 11 V4 H10 L21 15 L14 22 L3 11Z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function ImageIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="M21 15 L16 10 L4 21" />
    </svg>
  );
}

export function PinIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M12 21 C 12 21 5 14 5 9 C 5 5.13 8.13 2 12 2 C 15.87 2 19 5.13 19 9 C 19 14 12 21 12 21 Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function UserIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 C 4 16 8 14 12 14 C 16 14 20 16 20 21" />
    </svg>
  );
}

export function HeartIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <path d="M12 21 C 12 21 4 14.5 4 8.5 C 4 5.46 6.46 3 9.5 3 C 11.24 3 12 4.5 12 4.5 C 12 4.5 12.76 3 14.5 3 C 17.54 3 20 5.46 20 8.5 C 20 14.5 12 21 12 21 Z" />
    </svg>
  );
}

export function CalendarIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function CompassIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...baseProps(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8 L13 13 L8 16 L11 11 Z" fill="currentColor" />
    </svg>
  );
}
