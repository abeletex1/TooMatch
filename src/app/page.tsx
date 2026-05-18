"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Logo from "@/components/ui/Logo";
import { buttonClasses } from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import GoogleIcon from "@/components/ui/GoogleIcon";

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tLang = useTranslations("language");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/match");
    });
  }, [router]);

  return (
    <MobileShell>
      <Topbar right={
        <button
          type="button"
          className="text-[12px] font-medium text-ink-2 px-2.5 py-1 rounded-lg bg-bg-2 border border-border active:bg-bg-3"
          onClick={() => {
            const current = document.cookie.split("; ").find(r => r.startsWith("NEXT_LOCALE="))?.split("=")[1];
            const next = current === "en" ? "es" : "en";
            document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
            window.location.reload();
          }}
        >
          {tLang("current")} → {tLang("switchTo")}
        </button>
      } />

      <main className="flex flex-1 flex-col px-7 pb-7">
        <section className="flex-1 flex flex-col items-center justify-center py-8">
          <Logo size="lg" align="center" />
          <p className="font-serif italic text-[17px] text-ink-3 mt-7 text-center">
            Stop likes. Start match.
          </p>
        </section>

        <section className="flex flex-col gap-2.5">
          <p className="text-center text-[10px] tracking-[0.1em] uppercase text-ink-3 mb-2">
            {t("createAccount")}
          </p>

          <a href="/auth/google" className={buttonClasses("outline", true)}>
            <GoogleIcon size={18} />
            <span>{t("googleContinue")}</span>
          </a>

          <Divider text={t("orWithEmail")} />

          <Link href="/signup" className={buttonClasses("outline", true)}>
            {t("createWithEmail")}
          </Link>

          <p className="text-center text-[11px] text-rose-dark font-light leading-relaxed">
            ⚠ {t("noCorporateEmail")}
          </p>

          <p className="text-center text-[12px] text-ink-3 font-light mt-3">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-rose underline underline-offset-2">
              {t("signIn")}
            </Link>
          </p>

          <p className="text-center text-[11px] text-ink-3 font-light mt-1 leading-relaxed">
            {t("termsAccept")}{" "}
            <Link href="/terms" className="underline">{t("terms")}</Link> {" "}
            <Link href="/privacy" className="underline">{t("privacy")}</Link>
          </p>
        </section>
      </main>
    </MobileShell>
  );
}
