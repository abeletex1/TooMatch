import { ReactNode } from "react";

/**
 * Contenedor mobile-first. En pantallas pequeñas ocupa todo el viewport;
 * en escritorio se centra con un ancho máximo tipo móvil para preservar
 * la sensación de app nativa.
 */
export default function MobileShell({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}
