"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Logo from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";

export default function HomePage() {
  const [googleMsg, setGoogleMsg] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/match");
    });
  }, [router]);

  return (
    <MobileShell>
      <Topbar />

      <main className="flex flex-1 flex-col px-7 pb-7">
        <section className="flex-1 flex flex-col items-center justify-center py-8">
          <Logo size="lg" align="center" />
          <p className="font-serif italic text-[17px] text-ink-3 mt-7 text-center">
            Stop likes. Start match.
          </p>
        </section>

        <section className="flex flex-col gap-2.5">
          <p className="text-center text-[10px] tracking-[0.1em] uppercase text-ink-3 mb-2">
            Crear cuenta
          </p>

          <button
            type="button"
            onClick={() => setGoogleMsg(true)}
            className={buttonClasses("outline", true)}
          >
            <GoogleIcon size={18} />
            <span>Continuar con Google</span>
          </button>
          {googleMsg && (
            <p className="text-[12px] text-ink-3 font-light text-center -mt-1">
              Aún no está disponible
            </p>
          )}

          <Divider text="o con correo" />

          <Link href="/signup" className={buttonClasses("outline", true)}>
            Crear cuenta con correo
          </Link>

          <p className="text-center text-[12px] text-ink-3 font-light mt-3">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-rose underline underline-offset-2">
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
