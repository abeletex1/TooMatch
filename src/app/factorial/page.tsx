import Link from "next/link";
import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Too Match × Facts — Find your Match",
  description: "Encuentra tu match en Facts. Compatibilidad real, sin fotos hasta que hay conexión.",
};

export default function FactorialPage() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-7 py-10">
      <div className="w-full max-w-[390px] flex flex-col items-center text-center animate-fade-up">

        {/* Logo */}
        <div className="mb-2">
          <Logo size="sm" align="center" />
        </div>
        <p className="font-serif italic text-[13px] text-ink-3 mb-10">
          Stop likes. Start match.
        </p>

        {/* Headline */}
        <div className="mb-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-rose font-medium mb-3">
            Facts 2025 · Edición especial
          </p>
          <h1 className="font-serif text-[34px] text-ink font-medium leading-[1.15]">
            Find your Match{" "}
            <em className="italic text-rose">at Facts</em>
          </h1>
        </div>

        <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm my-6" />

        {/* Tres puntos */}
        <div className="flex flex-col gap-4 mb-9 text-left w-full">
          <div className="flex items-start gap-3.5">
            <span className="text-rose mt-0.5 text-[16px] shrink-0">✦</span>
            <p className="text-[13px] text-ink-2 font-light leading-[1.6]">
              Tu match llega por <strong className="font-medium text-ink">compatibilidad real</strong>, no por fotos ni likes. La IA lo elige por ti.
            </p>
          </div>
          <div className="flex items-start gap-3.5">
            <span className="text-rose mt-0.5 text-[16px] shrink-0">✦</span>
            <p className="text-[13px] text-ink-2 font-light leading-[1.6]">
              Las fotos están <strong className="font-medium text-ink">bloqueadas hasta 7 mensajes</strong>. Primero conexión, luego apariencia.
            </p>
          </div>
          <div className="flex items-start gap-3.5">
            <span className="text-rose mt-0.5 text-[16px] shrink-0">✦</span>
            <p className="text-[13px] text-ink-2 font-light leading-[1.6]">
              <strong className="font-medium text-ink">Un match al día</strong>, elegido entre todos los que participan en Facts esta semana.
            </p>
          </div>
        </div>

        {/* CTA principal */}
        <Link
          href="/signup"
          className="w-full py-4 rounded-2xl bg-ink text-bg text-[14px] font-light tracking-wide text-center hover:opacity-90 transition-opacity"
        >
          Crear mi perfil →
        </Link>

        {/* Login secundario */}
        <p className="text-[12px] text-ink-3 font-light mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-rose-dark underline underline-offset-2">
            Entrar
          </Link>
        </p>

        {/* Footer discreto */}
        <p className="text-[10px] text-ink-3 font-light mt-10 opacity-60">
          Too Match · Solo disponible para participantes de Facts
        </p>
      </div>
    </div>
  );
}
