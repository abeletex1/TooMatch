import Link from "next/link";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Pantalla genérica para cuando un enlace de auth (confirmación, magic link)
 * ha caducado o es inválido.
 */
export default function AuthErrorPage() {
  return (
    <MobileShell>
      <Topbar />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center">
        <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
          Enlace no válido
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-3 max-w-[300px] leading-relaxed">
          El enlace de confirmación ha caducado o ya se ha usado. Crea cuenta
          de nuevo para recibir uno fresco, o inicia sesión si ya activaste
          la tuya antes.
        </p>

        <Link
          href="/signup"
          className={`${buttonClasses("ink", true)} mt-8`}
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className={`${buttonClasses("outline", true)} mt-2.5`}
        >
          Iniciar sesión
        </Link>
      </main>
    </MobileShell>
  );
}
