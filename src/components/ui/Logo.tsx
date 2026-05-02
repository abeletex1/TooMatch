import InfinitySymbol from "./InfinitySymbol";

type Size = "sm" | "lg";

/**
 * Logo de Too Match: la letra "T" en serif ink seguida del símbolo infinito (∞)
 * en verde salvia, con el subtítulo "MATCH" debajo en mayúsculas espaciadas.
 *
 *  - "sm": versión compacta para topbars
 *  - "lg": versión grande para pantallas de bienvenida
 */
export default function Logo({
  size = "sm",
  align = "center",
}: {
  size?: Size;
  align?: "left" | "center";
}) {
  const isLarge = size === "lg";
  const tFontSize = isLarge ? 56 : 22;
  const infinitySize = isLarge ? 56 : 24;

  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-center"
          : "flex flex-col items-start"
      }
    >
      <div className="flex items-center" aria-label="Too Match">
        <span
          className="font-serif font-medium text-ink leading-none"
          style={{ fontSize: tFontSize }}
        >
          T
        </span>
        <span
          className="flex items-center"
          style={{ marginLeft: isLarge ? 0 : 0 }}
          aria-hidden
        >
          <InfinitySymbol size={infinitySize} />
        </span>
      </div>
      <span
        className={`font-sans uppercase text-ink-3 mt-[3px] ${
          isLarge
            ? "text-[10px] tracking-[0.32em] pl-[0.32em]"
            : "text-[7.5px] tracking-[0.22em] pl-[0.22em]"
        }`}
      >
        Match
      </span>
    </div>
  );
}
