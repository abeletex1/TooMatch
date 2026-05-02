import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Logo from "@/components/ui/Logo";
import Button, { buttonClasses } from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";

/**
 * Auth landing — primera pantalla de la app.
 * Hero centrado verticalmente con T∞ y la tagline. Dos accesos para crear
 * cuenta (Google o correo) y enlace para iniciar sesión.
 *
 * Si ya hay sesión, mandamos al usuario a donde corresponda según el
 * estado de su onboarding (vía getPostAuthRedirect).
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const next = await getPostAuthRedirect();
    redirect(next);
  }

  return (
    <MobileShell>
      <Topbar />

      <main className="flex flex-1 flex-col px-7 pb-7">
        {/* Hero — ocupa todo el espacio sobrante por encima del bloque de auth */}
        <section className="flex-1 flex flex-col items-center justify-center py-8">
          <Logo size="lg" align="center" />
          <p className="font-serif italic text-[17px] text-ink-3 mt-7 text-center">
            Stop likes. Start match.
          </p>
        </section>

        {/* Auth */}
        <section className="flex flex-col gap-2.5">
          <p className="text-center text-[10px] tracking-[0.1em] uppercase text-ink-3 mb-2">
            Crear cuenta
          </p>

          <Button variant="outline" fullWidth>
            <GoogleIcon size={18} />
            <span>Continuar con Google</span>
          </Button>

          <Divider text="o con correo" />

          <Link href="/signup" className={buttonClasses("outline", true)}>
            Crear cuenta con correo
          </Link>

          <p className="text-center text-[12px] text-ink-3 font-light mt-3">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-rose underline underline-offset-2"
            >
              Iniciar sesión
            </Link>
          </p>

          <p className="text-center text-[11px] text-ink-3 font-light mt-1 leading-relaxed">
            Al continuar aceptas nuestros{" "}
            <span className="underline">Términos</span> y{" "}
            <span className="underline">Política de Privacidad</span>
          </p>
        </section>
      </main>
    </MobileShell>
  );
}
