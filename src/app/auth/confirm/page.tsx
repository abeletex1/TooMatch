import { Suspense } from "react";
import { confirmEmailAction } from "./actions";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Logo from "@/components/ui/Logo";

// Esta página actúa como barrera anti-prefetch de iOS.
// iOS Mail precarga la URL pero no hace submit de formularios,
// así el token se conserva hasta que el usuario pulsa el botón.

function ConfirmButton({ code, next }: { code: string; next: string }) {
  return (
    <form action={confirmEmailAction}>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="w-full py-4 rounded-2xl bg-ink text-bg text-[14px] font-light tracking-wide hover:opacity-90 transition-opacity"
      >
        Confirmar y entrar →
      </button>
    </form>
  );
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const code = params.code ?? "";
  const next = params.next ?? "/welcome";

  if (!code) {
    return (
      <MobileShell>
        <Topbar />
        <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center">
          <p className="text-[13px] text-ink-2 font-light">
            Enlace no válido. Vuelve a registrarte.
          </p>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Topbar />
      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center">
        <div className="mb-6">
          <Logo size="sm" align="center" />
        </div>

        <h1 className="font-serif text-[28px] text-ink font-medium leading-tight mb-3">
          Tu email está{" "}
          <em className="italic text-rose">confirmado</em>
        </h1>
        <p className="text-[13px] text-ink-2 font-light mb-8 max-w-[280px] leading-relaxed">
          Pulsa el botón para entrar a Too Match y completar tu perfil.
        </p>

        <div className="w-full">
          <Suspense>
            <ConfirmButton code={code} next={next} />
          </Suspense>
        </div>
      </main>
    </MobileShell>
  );
}
