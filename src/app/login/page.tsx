"use client";

import { useActionState } from "react";
import Link from "next/link";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Button from "@/components/ui/Button";
import Input, { FormLabel } from "@/components/ui/Input";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { loginAction } from "./actions";

/**
 * Pantalla de inicio de sesión.
 * Email + password o Google. Tras éxito → /match.
 */
export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <MobileShell>
      <Topbar back="/" />

      <main className="flex flex-1 flex-col px-7 pt-9 pb-7">
        <h1 className="font-serif text-[32px] text-ink font-medium leading-tight">
          Iniciar sesión
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-2">
          Bienvenido de vuelta.
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
            <FormLabel htmlFor="login-email">Correo</FormLabel>
            <Input
              id="login-email"
              type="email"
              name="email"
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <FormLabel htmlFor="login-password">Contraseña</FormLabel>
            <Input
              id="login-password"
              type="password"
              name="password"
              placeholder="Tu contraseña"
              required
              autoComplete="current-password"
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
            {isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-[12px] text-ink-3 font-light mt-auto pt-6">
          ¿No tienes cuenta?{" "}
          <Link
            href="/signup"
            className="text-rose underline underline-offset-2"
          >
            Crear cuenta
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}
