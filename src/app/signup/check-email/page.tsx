import Link from "next/link";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import ResendButton from "./ResendButton";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <MobileShell>
      <Topbar back="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center">
        {/* Icono de sobre */}
        <div className="w-14 h-14 rounded-full bg-rose-light border-[1.5px] border-rose-mid flex items-center justify-center mb-6">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C4735A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>

        <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
          Revisa tu correo
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-3 max-w-[300px] leading-relaxed">
          Te hemos enviado un enlace de confirmación
          {email ? (
            <>
              {" "}a <span className="text-ink">{email}</span>
            </>
          ) : null}
          . Haz clic en él para activar tu cuenta y empezar.
        </p>

        <p className="text-[11px] text-ink-3 font-light mt-6 max-w-[280px]">
          ¿No lo ves? Mira en spam o promociones.
        </p>

        {email && <ResendButton email={email} />}

        <p className="text-[12px] text-ink-3 font-light mt-10">
          ¿Te equivocaste?{" "}
          <Link
            href="/signup"
            className="text-rose underline underline-offset-2"
          >
            Volver a crear cuenta
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}
