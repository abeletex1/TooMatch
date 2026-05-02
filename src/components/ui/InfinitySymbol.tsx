/**
 * Símbolo infinito (∞) en color verde salvia, dibujado como SVG con un
 * único path en figura de ocho horizontal: las dos curvas se cruzan
 * en el centro como un infinito tipográfico clásico.
 *
 * El color está hardcodeado al sage del brand (#6B8C7E) para que sea
 * exactamente el mismo en cualquier contexto, sin depender de utilidades
 * de Tailwind o variables CSS.
 */
export default function InfinitySymbol({
  size = 60,
  color = "#6B8C7E",
  strokeWidth,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  // Stroke escalado al tamaño para mantener proporciones visuales.
  const sw = strokeWidth ?? size / 24;
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M 45 5
           C 57.74 5 57.74 25 45 25
           C 32.26 25 27.16 5 15 5
           C 3.55 5 3.55 25 15 25
           C 27.16 25 32.26 5 45 5 Z"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
