"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Button from "@/components/ui/Button";
import Input, { FormLabel } from "@/components/ui/Input";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { loginAction, resetPasswordAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [resetState, resetAction, resetPending] = useActionState(resetPasswordAction, null);
  const [showReset, setShowReset] = useState(false);
  const t = useTranslations("auth");

  return (
    <MobileShell>
      <Topbar back="/" />

      <main className="flex flex-1 flex-col px-7 pt-9 pb-7">
        <h1 className="font-serif text-[32px] text-ink font-medium leading-tight">
          {t("signIn")}
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-2">
          {t("welcomeBack")}
        </p>

        <div className="mt-7">
          <a
            href="/auth/google"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl px-4 py-[13px] text-[13px] bg-bg text-ink border-[0.5px] border-border-strong hover:bg-bg-2 w-full"
          >
            <GoogleIcon size={18} />
            <span>{t("googleContinue")}</span>
          </a>
        </div>

        <div className="my-3">
          <Divider text={t("orWithEmail")} />
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <FormLabel htmlFor="login-email">{t("emailLabel")}</FormLabel>
            <Input
              id="login-email"
              type="email"
              name="email"
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <FormLabel htmlFor="login-password">{t("passwordLabel")}</FormLabel>
            <Input
              id="login-password"
              type="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowReset(!showReset)}
              className="text-[11px] text-ink-3 hover:text-rose-dark underline underline-offset-2 mt-1.5 block"
            >
              {t("forgotPassword")}
            </button>
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
            {isPending ? t("signingIn") : t("signIn")}
          </Button>
        </form>

        {showReset && (
          <div className="mt-4 p-4 bg-bg-2 rounded-xl border-[0.5px] border-border">
            <p className="text-[12px] text-ink-2 font-light mb-3">{t("forgotPasswordBody")}</p>
            {resetState?.error === undefined && resetState !== null ? (
              <p className="text-[12px] text-rose font-light">{t("resetLinkSent")}</p>
            ) : (
              <form action={resetAction} className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  className="flex-1 border-[0.5px] border-border-strong rounded-xl px-3 py-2 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose"
                />
                <button
                  type="submit"
                  disabled={resetPending}
                  className="px-3 py-2 rounded-xl bg-ink text-bg text-[12px] font-light disabled:opacity-50 shrink-0"
                >
                  {resetPending ? "…" : t("sendResetLink")}
                </button>
              </form>
            )}
            {resetState?.error && (
              <p className="text-[11px] text-rose-dark mt-2">{resetState.error}</p>
            )}
          </div>
        )}

        <p className="text-center text-[12px] text-ink-3 font-light mt-auto pt-6">
          {t("dontHaveAccount")}{" "}
          <Link href="/signup" className="text-rose underline underline-offset-2">
            {t("createAccount")}
          </Link>
        </p>
      </main>
    </MobileShell>
  );
}
