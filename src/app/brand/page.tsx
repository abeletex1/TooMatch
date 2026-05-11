import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BrandCTA from "./BrandCTA";
import { logoutAction } from "@/app/logout/actions";

export default async function BrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("brand");
  const tCommon = await getTranslations("common");

  return (
    <MobileShell>
      <Topbar right={tCommon("day0")} back="/welcome" />

      <main className="flex flex-1 flex-col px-7 pt-8 pb-6 text-center">
        <div className="animate-fade-up flex-1 flex flex-col">
          <p className="font-serif italic text-[15px] text-ink-3 mt-2 mb-10">
            Stop likes. Start match.
          </p>

          <h1 className="font-serif text-[28px] text-ink font-medium leading-[1.25] mb-5">
            {t("tagline1")}{" "}
            <em className="italic text-rose">{t("tagline2")}</em>{" "}
            {t("tagline3")}{" "}
            <em className="italic text-rose">{t("tagline4")}</em>
          </h1>

          <div className="w-9 h-[1.5px] bg-rose-mid rounded-sm mx-auto my-1" />

          <p className="text-[13px] text-ink-2 font-light leading-[1.7] mt-6 max-w-[300px] mx-auto">
            {t("tagline5")}
            <br />
            {t("tagline6")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-6">
          <BrandCTA />
        </div>

        <form action={logoutAction} className="text-center pt-4 -mb-2">
          <button
            type="submit"
            className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
          >
            {tCommon("logout")}
          </button>
        </form>
      </main>
    </MobileShell>
  );
}
