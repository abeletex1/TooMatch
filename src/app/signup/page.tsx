"use client";

import { useActionState } from "react";
import Link from "next/link";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Button from "@/components/ui/Button";
import Input, { FormLabel } from "@/components/ui/Input";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { signupAction } from "./actions";

/**
 * Pantalla de creación de cuenta.
 * Email + password (mín 6 caracteres) o Google.
 * Tras crear la cuenta correctamente, redirige a /welcome.
 */
export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);

  return (
    <MobileShell>
      <Topbar back="/" />

      <main className="flex flex-1 flex-col px-7 pt-9 pb-7">
        <h1 className="font-serif text-[32px] text-ink font-medium leading-tight">
          Crear cuenta
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-2">
          Bienvenido. Empecemos.
        </p>

        <div className="mt-7">
          <a
            href="/auth/google"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl px-4 py-[13px] text-[13px] bg-bg text-ink border-[0.5px] border-border-strong hover:bg-bg-2 w-full"
          >
            <GoogleIcon size={18} />
            <span>Continuar con Google</span>
          </a>
        </div>

        <div className="my-3">
          <Divider text="o con correo" />
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <FormLabel htmlFor="signup-email">Correo</FormLabel>
            <Input
              id="signup-email"
              type="email"
              name="email"
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <FormLabel htmlFor="signup-password">Contraseña</FormLabel>
            <Input
              id="signup-password"
              type="password"
              name="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {state?.error ? (
            <p className="text-[12px] text-rose-dark font-light">
              {state.error}
            </p>
          ) : null}

          <Button
            variant="ink"
            fullWidth
            type="submit"
            disabled={isPending}
            className="mt-2"
          >
            {isPending ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-[12px] text-ink-3 font-light mt-auto pt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-rose underline underline-offset-2"
          >
            Iniciar sesión
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}
