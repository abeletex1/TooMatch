import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";
import InfinitySymbol from "@/components/ui/InfinitySymbol";
import { logoutAction } from "@/app/logout/actions";

/**
 * Día 0 — pantalla de confirmación que aparece justo después de terminar
 * el onboarding. Mensaje calmado y promesa: mañana llega el primer match.
 */
export default async function Day0Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Si todavía no acabaste el onboarding, no tienes nada que hacer aquí.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, relationship_intent")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/welcome");

  return (
    <MobileShell>
      <Topbar right="Día 0" />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center animate-fade-up">
        {/* Icono central — infinito en sage para reforzar marca */}
        <div className="w-16 h-16 rounded-2xl bg-rose-light flex items-center justify-center mb-6">
          <InfinitySymbol size={36} strokeWidth={2.5} />
        </div>

        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-3">
          Día 0
        </p>

        <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-3">
          Perfil <em className="italic text-rose">completado.</em>
        </h1>

        <p className="text-[14px] text-ink-2 font-light leading-[1.7] max-w-[300px]">
          Mañana llega tu <span className="text-ink">primer match</span>. Lo
          eligimos con calma para que tenga sentido — sin scroll, sin prisa.
        </p>

        {/* Divisor decorativo */}
        <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-7" />

        <p className="font-serif italic text-[16px] text-ink leading-[1.5] max-w-[280px]">
          Lo bueno se hace esperar. Un día.
        </p>

        <Link
          href={profile?.relationship_intent ? "/match" : "/onboarding-question"}
          className={`${buttonClasses("rose", true)} mt-12`}
        >
          Ver mi inicio
        </Link>

        {/* Logout sutil */}
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
    </MobileShell>
  );
}
