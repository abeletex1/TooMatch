import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";

export default async function AuthErrorPage() {
  const t = await getTranslations("authError");
  const tAuth = await getTranslations("auth");

  return (
    <MobileShell>
      <Topbar />

      <main className="flex flex-1 flex-col items-center justify-center px-7 pb-7 text-center">
        <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
          {t("title")}
        </h1>
        <p className="text-[13px] text-ink-2 font-light mt-3 max-w-[300px] leading-relaxed">
          {t("description")}
        </p>

        <Link href="/signup" className={`${buttonClasses("ink", true)} mt-8`}>
          {tAuth("createAccount")}
        </Link>
        <Link href="/login" className={`${buttonClasses("outline", true)} mt-2.5`}>
          {tAuth("signIn")}
        </Link>
      </main>
    </MobileShell>
  );
}
