import Link from "next/link";
import { ReactNode } from "react";
import Logo from "./Logo";

/**
 * Barra superior. Si pasas `back`, muestra una flecha rosa enlazada a esa
 * URL antes del logo. El slot `right` permite mostrar un badge contextual
 * (ej. "Día 1") en otras pantallas.
 */
export default function Topbar({
  back,
  right,
}: {
  back?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-[14px] pb-[11px] border-b-[0.5px] border-border bg-bg">
      <div className="flex items-center gap-3">
        {back ? (
          <Link
            href={back}
            aria-label="Volver"
            className="text-rose text-[22px] leading-none -ml-1 px-1 hover:opacity-70"
          >
            ←
          </Link>
        ) : null}
        <Logo size="sm" align="left" />
      </div>
      {right ? <div className="text-[11px] text-ink-3">{right}</div> : null}
    </div>
  );
}
